"""Helper functions for the memory search pipeline."""

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import MemoryEntry


async def hybrid_search(
    session: AsyncSession,
    character_id: str,
    query_embedding: list[float] | None,
    keyword: str | None = None,
    entry_types: list[str] | None = None,
    limit: int = 10,
) -> list[MemoryEntry]:
    """Combine vector similarity search with keyword filtering.

    Falls back to keyword/recency search when no embedding is available.
    """
    if query_embedding is not None:
        # Vector search using pgvector cosine distance
        stmt = (
            select(MemoryEntry)
            .where(MemoryEntry.character_id == character_id)
            .where(MemoryEntry.embedding.isnot(None))
        )
        if entry_types:
            stmt = stmt.where(MemoryEntry.entry_type.in_(entry_types))
        stmt = stmt.order_by(MemoryEntry.embedding.cosine_distance(query_embedding)).limit(limit)
        result = await session.execute(stmt)
        return result.scalars().all()

    # Fallback: keyword + recency
    stmt = (
        select(MemoryEntry)
        .where(MemoryEntry.character_id == character_id)
    )
    if entry_types:
        stmt = stmt.where(MemoryEntry.entry_type.in_(entry_types))
    if keyword:
        stmt = stmt.where(MemoryEntry.content.ilike(f"%{keyword}%"))
    stmt = stmt.order_by(MemoryEntry.created_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()


def format_memory_context(canon: list[MemoryEntry], episodic: list[MemoryEntry]) -> str:
    """Format memory entries into a context string for LLM prompts."""
    parts = ["=== CHARACTER CANON ==="]
    for entry in canon:
        parts.append(f"- {entry.content}")
    parts.append("\n=== RELEVANT HISTORY ===")
    for entry in episodic:
        parts.append(f"- [{entry.entry_type.value}] {entry.content}")
    return "\n".join(parts)
