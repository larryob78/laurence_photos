"""Test the Director state machine logic with mocked external APIs."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.director.state import JobState, JobStatus


def test_job_state_creation():
    job = JobState(character_id="char-1", format_id="fmt-1", question="Why?")
    assert job.status == JobStatus.BRIEF
    assert job.attempts == {"script": 0, "voice": 0, "video": 0, "repair": 0}


def test_can_retry():
    job = JobState()
    assert job.can_retry("script") is True
    job.attempts["script"] = 3
    assert job.can_retry("script") is False


def test_record_attempt():
    job = JobState()
    job.record_attempt("script")
    assert job.attempts["script"] == 1
    job.record_attempt("script")
    assert job.attempts["script"] == 2


def test_advance():
    job = JobState()
    assert job.status == JobStatus.BRIEF
    job.advance(JobStatus.SCRIPTING)
    assert job.status == JobStatus.SCRIPTING


def test_record_error():
    job = JobState()
    job.record_error("script", "Something went wrong")
    assert len(job.error_log) == 1
    assert job.error_log[0]["stage"] == "script"
    assert "Something went wrong" in job.error_log[0]["error"]


def test_serialisation_roundtrip():
    job = JobState(character_id="c1", format_id="f1", question="Test?")
    job.advance(JobStatus.SCORING)
    job.record_attempt("script")

    data = job.to_dict()
    restored = JobState.from_dict(data)

    assert restored.status == JobStatus.SCORING
    assert restored.attempts["script"] == 1
    assert restored.character_id == "c1"
    assert restored.question == "Test?"


@pytest.mark.asyncio
async def test_director_loop_mocked():
    """Test the Director loop with all external APIs mocked."""
    from src.director.loop import Director

    mock_script = {
        "variation_id": 1,
        "hook": "Why did you destroy the city?",
        "beats": [
            {"beat_name": "denial", "line": "I did NOT destroy the city!", "character": "super-claws"},
            {"beat_name": "evidence", "line": "There's video footage.", "character": "red"},
        ],
        "twist": "Super Claws reframes destruction as 'urban renewal'",
        "loop_back": "But what about the bridge?",
    }

    mock_score = {
        "hook": 8, "clarity": 8, "character_consistency": 9,
        "comedy_tension": 8, "surprise": 7, "loop_potential": 8,
        "shareability": 8, "average": 8.0,
        "publish_recommendation": True, "notes": "Strong episode",
    }

    # Build mocks
    claude = AsyncMock()
    claude.write_script = AsyncMock(return_value=[mock_script] * 5)
    claude.score_script = AsyncMock(return_value=mock_score)
    claude.localise_script = AsyncMock(return_value={
        "localised_script": mock_script,
        "adaptation_notes": "Adapted for Thai audience",
    })

    elevenlabs = AsyncMock()
    elevenlabs.generate_voice = AsyncMock(return_value=b"fake-audio-data")

    runway = AsyncMock()
    runway.create_and_wait = AsyncMock(return_value={
        "task_id": "task-123", "status": "SUCCEEDED", "video_uri": "file:///tmp/video.mp4"
    })

    storage = AsyncMock()
    storage.save = AsyncMock(return_value="file:///tmp/audio.mp3")

    wiki = AsyncMock()
    wiki.get_character = AsyncMock(return_value={
        "id": "char-1", "name": "super-claws", "archetype": "delusional hero",
        "core_flaw": "overconfident", "taboos": [], "catchphrases": [],
        "language_style": "bombastic", "safety_rules": {},
    })
    wiki.get_format = AsyncMock(return_value={
        "id": "fmt-1", "name": "interrogation",
        "hook_template": "Accusation", "beat_sheet": ["hook", "denial", "evidence"],
        "length_min_seconds": 10, "length_max_seconds": 20,
        "ending_pattern": "reframe",
    })
    wiki.get_relevant_memory = AsyncMock(return_value="=== CHARACTER CANON ===\n- test\n")
    wiki.get_voice_profile = AsyncMock(return_value=MagicMock(voice_id="v1", settings={}))
    wiki.add_memory_entry = AsyncMock()

    db_session = AsyncMock()

    director = Director(claude, elevenlabs, runway, storage, wiki, db_session)

    job = JobState(character_id="char-1", format_id="fmt-1", question="Why did you destroy the city?")
    result = await director.run_job(job)

    assert result.status == JobStatus.PUBLISHED
    assert result.attempts["script"] >= 1
    assert result.selected_script is not None
    assert result.assets["audio_uri"] is not None
    assert len(result.assets["video_uris"]) > 0
    assert result.scores["final_score"]["average"] >= 7.5
    wiki.add_memory_entry.assert_called_once()
