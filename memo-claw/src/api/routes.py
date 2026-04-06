"""API routes for Memo Claw."""

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.models import Character, Episode, MemoryEntry, Scorecard
from src.db.session import get_session
from src.director.loop import Director
from src.director.state import JobState
from src.memory.wiki import CharacterWiki
from src.tools.claude_client import ClaudeClient
from src.tools.elevenlabs_client import ElevenLabsClient
from src.tools.runway_client import RunwayClient
from src.tools.storage import StorageClient

router = APIRouter()


class CreateJobRequest(BaseModel):
    character_id: str
    format_id: str
    question: str


class AdvanceJobRequest(BaseModel):
    action: str  # "approve" | "reject" | "retry"


class AddMemoryRequest(BaseModel):
    entry_type: str
    content: str
    source: str


def _build_director(session: AsyncSession) -> Director:
    claude = ClaudeClient(settings.anthropic_api_key)
    elevenlabs = ElevenLabsClient(settings.elevenlabs_api_key)
    runway = RunwayClient(settings.runway_api_key)
    storage = StorageClient(settings.storage_base_path, settings.s3_bucket)
    wiki = CharacterWiki(session)
    return Director(claude, elevenlabs, runway, storage, wiki, session)


@router.post("/jobs")
async def create_job(req: CreateJobRequest, session: AsyncSession = Depends(get_session)):
    job = JobState(
        character_id=req.character_id,
        format_id=req.format_id,
        question=req.question,
    )
    director = _build_director(session)
    # Run in background
    asyncio.create_task(director.run_job(job))
    return {"job_id": job.job_id, "status": "BRIEF"}


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, session: AsyncSession = Depends(get_session)):
    episode = await session.get(Episode, job_id)
    if episode is None:
        raise HTTPException(404, "Job not found")
    return {
        "job_id": episode.id,
        "character_id": episode.character_id,
        "format_id": episode.format_id,
        "question": episode.question,
        "status": episode.status.value if episode.status else None,
        "attempt_counts": episode.attempt_counts,
        "scores": episode.scores,
        "created_at": episode.created_at.isoformat() if episode.created_at else None,
    }


@router.get("/jobs")
async def list_jobs(
    status: str | None = None,
    character_id: str | None = None,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Episode)
    if status:
        stmt = stmt.where(Episode.status == status)
    if character_id:
        stmt = stmt.where(Episode.character_id == character_id)
    stmt = stmt.order_by(Episode.created_at.desc()).limit(limit)
    result = await session.execute(stmt)
    episodes = result.scalars().all()
    return [
        {
            "job_id": ep.id,
            "question": ep.question,
            "status": ep.status.value if ep.status else None,
            "created_at": ep.created_at.isoformat() if ep.created_at else None,
        }
        for ep in episodes
    ]


@router.post("/jobs/{job_id}/advance")
async def advance_job(job_id: str, req: AdvanceJobRequest, session: AsyncSession = Depends(get_session)):
    episode = await session.get(Episode, job_id)
    if episode is None:
        raise HTTPException(404, "Job not found")
    if req.action == "approve":
        episode.status = "PUBLISHED"
    elif req.action == "reject":
        episode.status = "FAILED"
    elif req.action == "retry":
        episode.status = "SCRIPTING"
    await session.commit()
    return {"job_id": job_id, "status": episode.status}


@router.get("/characters")
async def list_characters(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Character))
    chars = result.scalars().all()
    return [
        {"id": c.id, "name": c.name, "archetype": c.archetype, "canon_version": c.canon_version}
        for c in chars
    ]


@router.get("/characters/{character_id}/memory")
async def get_character_memory(
    character_id: str,
    entry_type: str | None = None,
    limit: int = 10,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(MemoryEntry).where(MemoryEntry.character_id == character_id)
    if entry_type:
        stmt = stmt.where(MemoryEntry.entry_type == entry_type)
    stmt = stmt.order_by(MemoryEntry.created_at.desc()).limit(limit)
    result = await session.execute(stmt)
    entries = result.scalars().all()
    return [
        {
            "id": e.id,
            "entry_type": e.entry_type.value,
            "content": e.content,
            "source": e.source,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]


@router.post("/characters/{character_id}/memory")
async def add_memory(character_id: str, req: AddMemoryRequest, session: AsyncSession = Depends(get_session)):
    wiki = CharacterWiki(session)
    await wiki.add_memory_entry(
        character_id=character_id,
        entry_type=req.entry_type,
        content=req.content,
        source=req.source,
    )
    return {"status": "created"}


@router.get("/scorecards")
async def list_scorecards(
    episode_id: str | None = None,
    stage: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Scorecard)
    if episode_id:
        stmt = stmt.where(Scorecard.episode_id == episode_id)
    if stage:
        stmt = stmt.where(Scorecard.stage == stage)
    result = await session.execute(stmt)
    cards = result.scalars().all()
    return [
        {
            "id": c.id,
            "episode_id": c.episode_id,
            "stage": c.stage.value,
            "metrics": c.metrics,
            "passed": c.passed,
            "judge_model": c.judge_model,
        }
        for c in cards
    ]
