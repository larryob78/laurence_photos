"""Raw Memory Layer — stores all raw data, supports retrieval and grounding.

This layer remains unchanged and separate from the wiki.
It is the ground truth: campaigns, research, brand materials, generated outputs.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from napkin.models import DataLayer, Source

logger = logging.getLogger("napkin.raw_memory")

SCHEMA = """
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    ingested_at TEXT NOT NULL,
    layer TEXT NOT NULL DEFAULT 'global',
    client_id TEXT
);
CREATE TABLE IF NOT EXISTS embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL REFERENCES sources(id),
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding BLOB,
    UNIQUE(source_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_layer ON sources(layer);
CREATE INDEX IF NOT EXISTS idx_sources_client ON sources(client_id);
"""


class RawMemoryLayer:
    """Stores and retrieves raw source data.

    This is the foundation — all original data lives here.
    The wiki (synthesis layer) references this but never modifies it.
    """

    def __init__(self, db_path: str | Path = "napkin_raw.db"):
        self.db_path = Path(db_path)
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()
        logger.info("Raw memory layer initialized: %s", self.db_path)

    def ingest(self, source: Source) -> str:
        """Ingest a new source into raw memory. Returns the source ID."""
        self.conn.execute(
            "INSERT OR REPLACE INTO sources (id, name, source_type, content, metadata, ingested_at, layer, client_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                source.id, source.name, source.source_type, source.content,
                json.dumps(source.metadata), source.ingested_at,
                source.layer.value, source.client_id,
            ),
        )
        self._chunk_and_store(source)
        self.conn.commit()
        logger.info("Ingested source: %s [%s] (%s)", source.name, source.source_type, source.layer.value)
        return source.id

    def get(self, source_id: str) -> Optional[Source]:
        """Retrieve a source by ID."""
        row = self.conn.execute("SELECT * FROM sources WHERE id = ?", (source_id,)).fetchone()
        if not row:
            return None
        return Source(
            id=row["id"], name=row["name"], source_type=row["source_type"],
            content=row["content"], metadata=json.loads(row["metadata"]),
            ingested_at=row["ingested_at"], layer=DataLayer(row["layer"]),
            client_id=row["client_id"],
        )

    def search(
        self,
        query: str,
        source_type: Optional[str] = None,
        layer: Optional[DataLayer] = None,
        client_id: Optional[str] = None,
        limit: int = 20,
    ) -> list[dict]:
        """Search raw memory by keyword matching on chunks.

        For production, this would use vector similarity search.
        Current implementation uses SQLite FTS-style keyword matching.
        """
        conditions = ["chunk_text LIKE ?"]
        params: list = [f"%{query}%"]

        if source_type:
            conditions.append("s.source_type = ?")
            params.append(source_type)
        if layer:
            conditions.append("s.layer = ?")
            params.append(layer.value)
        if client_id:
            conditions.append("s.client_id = ?")
            params.append(client_id)

        where = " AND ".join(conditions)
        rows = self.conn.execute(
            f"SELECT e.chunk_text, e.chunk_index, s.id, s.name, s.source_type, s.layer "
            f"FROM embeddings e JOIN sources s ON e.source_id = s.id "
            f"WHERE {where} LIMIT ?",
            params + [limit],
        ).fetchall()

        return [
            {
                "source_id": r["id"], "source_name": r["name"],
                "source_type": r["source_type"], "layer": r["layer"],
                "chunk_index": r["chunk_index"], "chunk_text": r["chunk_text"],
            }
            for r in rows
        ]

    def list_sources(
        self,
        source_type: Optional[str] = None,
        layer: Optional[DataLayer] = None,
        limit: int = 100,
    ) -> list[dict]:
        """List sources with optional filters."""
        conditions = []
        params: list = []
        if source_type:
            conditions.append("source_type = ?")
            params.append(source_type)
        if layer:
            conditions.append("layer = ?")
            params.append(layer.value)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        rows = self.conn.execute(
            f"SELECT id, name, source_type, layer, client_id, ingested_at FROM sources {where} "
            f"ORDER BY ingested_at DESC LIMIT ?",
            params + [limit],
        ).fetchall()
        return [dict(r) for r in rows]

    def count(self) -> int:
        return self.conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0]

    def _chunk_and_store(self, source: Source, chunk_size: int = 500, overlap: int = 100):
        """Split source content into overlapping chunks for retrieval."""
        text = source.content
        if not text:
            return
        self.conn.execute("DELETE FROM embeddings WHERE source_id = ?", (source.id,))

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap

        for i, chunk in enumerate(chunks):
            self.conn.execute(
                "INSERT INTO embeddings (source_id, chunk_index, chunk_text) VALUES (?, ?, ?)",
                (source.id, i, chunk),
            )

    def enforce_layer_access(self, layer: DataLayer, client_id: Optional[str] = None) -> str:
        """Returns a SQL condition that enforces layer access rules.

        - GLOBAL: accessible to all
        - CATEGORY: accessible to all
        - CLIENT: only accessible with matching client_id
        """
        if layer == DataLayer.CLIENT and not client_id:
            raise PermissionError("Client layer requires a client_id for access")
        return f"(layer IN ('global', 'category') OR (layer = 'client' AND client_id = '{client_id}'))"

    def close(self):
        self.conn.commit()
        self.conn.close()
