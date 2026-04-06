"""Character wiki — retrieval-augmented memory for character consistency."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Character, Format, MemoryEntry, MemoryEntryType, VoiceProfile


class CharacterWiki:
    def __init__(self, db_session: AsyncSession, embed_client=None):
        self.db_session = db_session
        self.embed_client = embed_client

    async def get_character(self, character_id: str) -> dict:
        char = await self.db_session.get(Character, character_id)
        if char is None:
            raise ValueError(f"Character {character_id} not found")
        return {
            "id": char.id,
            "name": char.name,
            "archetype": char.archetype,
            "core_flaw": char.core_flaw,
            "taboos": char.taboos,
            "catchphrases": char.catchphrases,
            "language_style": char.language_style,
            "safety_rules": char.safety_rules,
            "canon_version": char.canon_version,
        }

    async def get_format(self, format_id: str) -> dict:
        fmt = await self.db_session.get(Format, format_id)
        if fmt is None:
            raise ValueError(f"Format {format_id} not found")
        return {
            "id": fmt.id,
            "name": fmt.name,
            "hook_template": fmt.hook_template,
            "beat_sheet": fmt.beat_sheet,
            "length_min_seconds": fmt.length_min_seconds,
            "length_max_seconds": fmt.length_max_seconds,
            "ending_pattern": fmt.ending_pattern,
        }

    async def get_voice_profile(self, character_id: str) -> VoiceProfile:
        result = await self.db_session.execute(
            select(VoiceProfile).where(VoiceProfile.character_id == character_id).limit(1)
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            raise ValueError(f"No voice profile for character {character_id}")
        return profile

    async def get_relevant_memory(self, character_id: str, query: str, limit: int = 5) -> str:
        """Retrieve relevant memory entries using hybrid search.

        Order matters:
        1. Canon entries first (stable character truths)
        2. Episodic entries second (what happened before)
        3. Feedback/fix entries last

        This prevents episodic drift from overriding character identity.
        """
        canon = await self._get_canon_entries(character_id)

        # For now, use recency-based retrieval (vector search added when embeddings are wired)
        episodic = await self._get_recent_entries(
            character_id, entry_types=[MemoryEntryType.EPISODIC, MemoryEntryType.FEEDBACK], limit=limit
        )

        context = "=== CHARACTER CANON ===\n"
        for entry in canon:
            context += f"- {entry.content}\n"
        context += "\n=== RELEVANT HISTORY ===\n"
        for entry in episodic:
            context += f"- [{entry.entry_type.value}] {entry.content}\n"

        return context

    async def add_memory_entry(
        self,
        character_id: str,
        entry_type: str,
        content: str,
        source: str,
        episode_id: str | None = None,
    ):
        embedding = await self._embed(content)
        entry = MemoryEntry(
            character_id=character_id,
            episode_id=episode_id,
            entry_type=MemoryEntryType(entry_type),
            content=content,
            source=source,
            embedding=embedding,
        )
        self.db_session.add(entry)
        await self.db_session.commit()

    async def _embed(self, text: str) -> list[float] | None:
        """Generate embedding. Placeholder — swap to voyage-ai or similar later."""
        # Return None until an embedding provider is configured
        return None

    async def _vector_search(self, character_id, embedding, entry_types, limit) -> list:
        """pgvector similarity search filtered by character and type."""
        if embedding is None:
            return []
        # When embeddings are wired, use:
        # SELECT * FROM memory_entries
        # WHERE character_id = :cid AND entry_type IN :types
        # ORDER BY embedding <-> :query_embedding LIMIT :limit
        return []

    async def _get_canon_entries(self, character_id: str) -> list:
        result = await self.db_session.execute(
            select(MemoryEntry).where(
                MemoryEntry.character_id == character_id,
                MemoryEntry.entry_type == MemoryEntryType.CANON,
            )
        )
        return result.scalars().all()

    async def _get_recent_entries(self, character_id: str, entry_types: list, limit: int) -> list:
        result = await self.db_session.execute(
            select(MemoryEntry)
            .where(
                MemoryEntry.character_id == character_id,
                MemoryEntry.entry_type.in_(entry_types),
            )
            .order_by(MemoryEntry.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
