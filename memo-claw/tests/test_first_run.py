"""Integration test for a full Memo Claw run.

Requires:
- Docker running with postgres (make up)
- Migrations applied (make migrate)
- Database seeded (make seed / memo-claw seed)

Set ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, RUNWAY_API_KEY in .env for live runs.
"""

import asyncio
import os

import pytest

from src.config import settings
from src.db.session import async_session_factory
from src.director.loop import Director
from src.director.state import JobState, JobStatus
from src.memory.wiki import CharacterWiki
from src.tools.claude_client import ClaudeClient
from src.tools.elevenlabs_client import ElevenLabsClient
from src.tools.runway_client import RunwayClient
from src.tools.storage import StorageClient


@pytest.mark.asyncio
@pytest.mark.skipif(
    not os.environ.get("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set — skipping integration test",
)
async def test_first_run_integration():
    """Full integration test: seed -> create job -> run director -> assert results."""
    from sqlalchemy import select
    from src.db.models import Character, Format, MemoryEntry
    from src.db.seed import seed

    # Seed if needed
    await seed()

    async with async_session_factory() as session:
        # Look up character + format
        result = await session.execute(select(Character).where(Character.name == "super-claws"))
        char = result.scalar_one()

        result = await session.execute(select(Format).where(Format.name == "Super Claws Interrogation"))
        fmt = result.scalar_one()

        # Create job
        job = JobState(
            character_id=char.id,
            format_id=fmt.id,
            question="Why did you destroy the city?",
        )

        # Build director
        director = Director(
            claude=ClaudeClient(settings.anthropic_api_key),
            elevenlabs=ElevenLabsClient(settings.elevenlabs_api_key),
            runway=RunwayClient(settings.runway_api_key),
            storage=StorageClient(settings.storage_base_path),
            wiki=CharacterWiki(session),
            db_session=session,
        )

        # Run
        result = await director.run_job(job)

        # Assertions
        print(f"\n=== FIRST RUN SUMMARY ===")
        print(f"Final status: {result.status.value}")
        print(f"Script attempts: {result.attempts.get('script', 0)}")
        print(f"Voice attempts: {result.attempts.get('voice', 0)}")
        print(f"Video attempts: {result.attempts.get('video', 0)}")

        if result.scores.get("script_scores"):
            print(f"Scripts scored: {len(result.scores['script_scores'])}")
            for i, s in enumerate(result.scores["script_scores"]):
                print(f"  Script {i+1}: avg={s['score']['average']}")

        if result.scores.get("final_score"):
            print(f"Final score: {result.scores['final_score']['average']}")

        if result.error_log:
            print(f"Errors ({len(result.error_log)}):")
            for err in result.error_log:
                print(f"  [{err['stage']}] {err['error'][:100]}")

        # At minimum, we should reach SCORING (scripts generated + scored)
        terminal_or_progress = result.status in (
            JobStatus.PUBLISHED, JobStatus.FAILED,
            JobStatus.SCORING, JobStatus.VOICE, JobStatus.VIDEO,
            JobStatus.QA, JobStatus.FINAL_SCORE, JobStatus.PUBLISH,
        )
        assert terminal_or_progress, f"Unexpected status: {result.status}"

        # Verify scripts were generated
        assert len(result.assets.get("scripts", [])) >= 1, "No scripts generated"

        # Verify scoring happened
        assert len(result.scores.get("script_scores", [])) >= 1, "No scores recorded"

        # Check memory was created (if published)
        if result.status == JobStatus.PUBLISHED:
            mem_result = await session.execute(
                select(MemoryEntry).where(MemoryEntry.character_id == char.id)
            )
            memories = mem_result.scalars().all()
            assert len(memories) > 0, "No memory entries created after publish"

        print("=== TEST PASSED ===")
