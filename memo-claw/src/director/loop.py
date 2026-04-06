"""The Director loop — heart of Memo Claw. Runs a single job through the full pipeline."""

import traceback

import structlog

from src.director.state import JobRepository, JobState, JobStatus
from src.memory.wiki import CharacterWiki
from src.tools.claude_client import ClaudeClient
from src.tools.elevenlabs_client import ElevenLabsClient
from src.tools.runway_client import RunwayClient
from src.tools.storage import StorageClient
from src.workers.localiser import Localiser

logger = structlog.get_logger()


class Director:
    def __init__(
        self,
        claude: ClaudeClient,
        elevenlabs: ElevenLabsClient,
        runway: RunwayClient,
        storage: StorageClient,
        wiki: CharacterWiki,
        db_session,
    ):
        self.claude = claude
        self.elevenlabs = elevenlabs
        self.runway = runway
        self.storage = storage
        self.wiki = wiki
        self.job_repo = JobRepository(db_session)
        self.db_session = db_session

    async def run_job(self, job: JobState) -> JobState:
        """Main loop — runs until PUBLISHED or FAILED."""
        character = None
        format_data = None

        while job.status not in (JobStatus.PUBLISHED, JobStatus.FAILED):
            try:
                if job.status == JobStatus.BRIEF:
                    logger.info("job.brief", job_id=job.job_id)
                    character = await self.wiki.get_character(job.character_id)
                    format_data = await self.wiki.get_format(job.format_id)
                    memory = await self.wiki.get_relevant_memory(job.character_id, job.question)
                    job.advance(JobStatus.SCRIPTING)

                elif job.status == JobStatus.SCRIPTING:
                    logger.info("job.scripting", job_id=job.job_id, attempt=job.attempts.get("script", 0) + 1)
                    job.record_attempt("script")
                    scripts = await self.claude.write_script(
                        character, format_data, job.question, memory, num_variations=5
                    )
                    job.assets["scripts"] = scripts
                    job.advance(JobStatus.SCORING)

                elif job.status == JobStatus.SCORING:
                    logger.info("job.scoring", job_id=job.job_id, num_scripts=len(job.assets["scripts"]))
                    scores = []
                    for script in job.assets["scripts"]:
                        score = await self.claude.score_script(script, character, format_data)
                        scores.append({"script": script, "score": score})

                    job.scores["script_scores"] = scores

                    passing = [s for s in scores if s["score"]["average"] >= job.thresholds["script_min"]]
                    passing.sort(key=lambda x: x["score"]["average"], reverse=True)

                    if passing:
                        job.selected_script = passing[0]["script"]
                        logger.info("job.script_selected", score=passing[0]["score"]["average"])

                        # Auto-generate Thai localisation
                        try:
                            localiser = Localiser(self.claude)
                            localised = await localiser.localise(job.selected_script, character, "th")
                            job.assets["localised_th"] = localised
                            logger.info("job.localised", language="th")
                        except Exception as loc_err:
                            logger.warning("job.localisation_failed", language="th", error=str(loc_err))

                        job.advance(JobStatus.VOICE)
                    elif job.can_retry("script"):
                        logger.warning("job.no_passing_scripts, retrying")
                        job.advance(JobStatus.SCRIPTING)
                    else:
                        job.status = JobStatus.FAILED
                        job.record_error("script", "No scripts passed threshold after max attempts")

                elif job.status == JobStatus.VOICE:
                    logger.info("job.voice", job_id=job.job_id)
                    job.record_attempt("voice")
                    spoken_text = self._script_to_speech_text(job.selected_script)
                    voice_profile = await self.wiki.get_voice_profile(job.character_id)
                    audio = await self.elevenlabs.generate_voice(
                        spoken_text, voice_profile.voice_id, voice_profile.settings
                    )
                    uri = await self.storage.save(audio, "audio", f"{job.job_id}.mp3")
                    job.assets["audio_uri"] = uri
                    job.advance(JobStatus.VIDEO)

                elif job.status == JobStatus.VIDEO:
                    logger.info("job.video", job_id=job.job_id)
                    job.record_attempt("video")
                    video_prompt = self._build_video_prompt(job.selected_script, character)
                    result = await self.runway.create_and_wait(video_prompt, storage=self.storage)
                    job.assets["video_uris"].append(result["video_uri"])
                    job.provider_meta["runway"] = {"task_id": result["task_id"]}
                    job.advance(JobStatus.QA)

                elif job.status == JobStatus.QA:
                    logger.info("job.qa", job_id=job.job_id)
                    # Auto-pass QA for now
                    job.advance(JobStatus.FINAL_SCORE)

                elif job.status == JobStatus.FINAL_SCORE:
                    logger.info("job.final_score", job_id=job.job_id)
                    final_score = await self.claude.score_script(
                        job.selected_script, character, format_data
                    )
                    job.scores["final_score"] = final_score

                    if final_score["average"] >= job.thresholds["final_min"]:
                        job.advance(JobStatus.PUBLISH)
                    elif job.can_retry("video"):
                        logger.warning("job.final_score_low, restarting from scripting")
                        job.advance(JobStatus.SCRIPTING)
                    else:
                        job.status = JobStatus.FAILED

                elif job.status == JobStatus.PUBLISH:
                    logger.info("job.publish", job_id=job.job_id)
                    job.assets["final_uri"] = job.assets["video_uris"][-1]
                    job.advance(JobStatus.PUBLISHED)

                    await self.wiki.add_memory_entry(
                        character_id=job.character_id,
                        entry_type="EPISODIC",
                        content=(
                            f"Episode {job.job_id}: question='{job.question}', "
                            f"final_score={job.scores['final_score']['average']}, "
                            f"scripts_attempted={job.attempts['script']}"
                        ),
                        source="director_loop",
                    )

            except Exception as e:
                logger.error("job.error", job_id=job.job_id, stage=job.status.value, error=str(e))
                traceback.print_exc()
                job.record_error(job.status.value, str(e))
                # Map current status to a retryable stage key
                stage_retry_map = {
                    JobStatus.SCRIPTING: "script",
                    JobStatus.SCORING: "script",
                    JobStatus.VOICE: "voice",
                    JobStatus.VIDEO: "video",
                    JobStatus.QA: "repair",
                    JobStatus.REPAIR: "repair",
                    JobStatus.FINAL_SCORE: "repair",
                }
                stage_key = stage_retry_map.get(job.status)
                if stage_key and job.can_retry(stage_key):
                    job.record_attempt(stage_key)
                    # For retriable stages, restart from a sensible point
                    if stage_key == "script":
                        job.advance(JobStatus.SCRIPTING)
                    elif stage_key in ("voice", "video", "repair"):
                        pass  # Re-enter same status on next iteration
                else:
                    job.status = JobStatus.FAILED

            await self.job_repo.save(job)

        logger.info("job.complete", job_id=job.job_id, final_status=job.status.value)
        return job

    def _script_to_speech_text(self, script: dict) -> str:
        lines = []
        for beat in script.get("beats", []):
            lines.append(beat.get("line", ""))
        return " ".join(lines)

    def _build_video_prompt(self, script: dict, character: dict) -> str:
        return (
            f"Clay-style animated character, toy-like, imperfect, cinematic miniature world. "
            f"{script.get('hook', '')}. Character: {character.get('name', '')} - "
            f"{character.get('archetype', '')}. Handcrafted feel, not generated."
        )
