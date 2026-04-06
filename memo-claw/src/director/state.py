"""Job state machine for the Director loop."""

import enum
import uuid
from dataclasses import dataclass, field
from datetime import datetime

from src.db.models import Episode, EpisodeStatus


class JobStatus(str, enum.Enum):
    BRIEF = "BRIEF"
    SCRIPTING = "SCRIPTING"
    SCORING = "SCORING"
    VOICE = "VOICE"
    VIDEO = "VIDEO"
    QA = "QA"
    REPAIR = "REPAIR"
    EDIT = "EDIT"
    FINAL_SCORE = "FINAL_SCORE"
    PUBLISH = "PUBLISH"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"


@dataclass
class JobState:
    job_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    status: JobStatus = JobStatus.BRIEF
    character_id: str = ""
    format_id: str = ""
    question: str = ""
    attempts: dict = field(default_factory=lambda: {"script": 0, "voice": 0, "video": 0, "repair": 0})
    max_attempts: dict = field(default_factory=lambda: {"script": 3, "voice": 2, "video": 3, "repair": 2})
    thresholds: dict = field(default_factory=lambda: {"script_min": 7.0, "final_min": 7.5})
    assets: dict = field(default_factory=lambda: {"scripts": [], "audio_uri": None, "video_uris": [], "final_uri": None})
    scores: dict = field(default_factory=lambda: {"script_scores": [], "final_score": None})
    selected_script: dict | None = None
    provider_meta: dict = field(default_factory=dict)
    error_log: list = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def can_retry(self, stage: str) -> bool:
        return self.attempts.get(stage, 0) < self.max_attempts.get(stage, 0)

    def record_attempt(self, stage: str):
        self.attempts[stage] = self.attempts.get(stage, 0) + 1
        self.updated_at = datetime.utcnow()

    def record_error(self, stage: str, error: str):
        self.error_log.append({"stage": stage, "error": error, "at": datetime.utcnow().isoformat()})

    def advance(self, new_status: JobStatus):
        self.status = new_status
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "status": self.status.value,
            "character_id": self.character_id,
            "format_id": self.format_id,
            "question": self.question,
            "attempts": self.attempts,
            "thresholds": self.thresholds,
            "assets": self.assets,
            "scores": self.scores,
            "selected_script": self.selected_script,
            "provider_meta": self.provider_meta,
            "error_log": self.error_log,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "JobState":
        data = dict(data)
        data["status"] = JobStatus(data["status"])
        for key in ("created_at", "updated_at"):
            if isinstance(data.get(key), str):
                data[key] = datetime.fromisoformat(data[key])
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class JobRepository:
    def __init__(self, db_session):
        self.db_session = db_session

    async def save(self, job: JobState):
        episode = await self.db_session.get(Episode, job.job_id)
        if episode is None:
            episode = Episode(
                id=job.job_id,
                character_id=job.character_id,
                format_id=job.format_id,
                question=job.question,
            )
            self.db_session.add(episode)

        # Map JobStatus to EpisodeStatus
        status_map = {
            JobStatus.BRIEF: EpisodeStatus.DRAFT,
            JobStatus.SCRIPTING: EpisodeStatus.SCRIPTING,
            JobStatus.SCORING: EpisodeStatus.SCRIPTING,
            JobStatus.VOICE: EpisodeStatus.VOICE,
            JobStatus.VIDEO: EpisodeStatus.VIDEO,
            JobStatus.QA: EpisodeStatus.QA,
            JobStatus.REPAIR: EpisodeStatus.QA,
            JobStatus.EDIT: EpisodeStatus.QA,
            JobStatus.FINAL_SCORE: EpisodeStatus.QA,
            JobStatus.PUBLISH: EpisodeStatus.QA,
            JobStatus.PUBLISHED: EpisodeStatus.PUBLISHED,
            JobStatus.FAILED: EpisodeStatus.FAILED,
        }
        episode.status = status_map.get(job.status, EpisodeStatus.DRAFT)
        episode.attempt_counts = job.attempts
        episode.scores = job.scores
        await self.db_session.commit()

    async def load(self, job_id: str) -> JobState | None:
        episode = await self.db_session.get(Episode, job_id)
        if episode is None:
            return None
        return JobState(
            job_id=episode.id,
            character_id=episode.character_id,
            format_id=episode.format_id,
            question=episode.question,
            attempts=episode.attempt_counts or {},
            scores=episode.scores or {},
        )
