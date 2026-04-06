"""Initial schema with all models and pgvector extension.

Revision ID: 001_initial
Revises: None
Create Date: 2026-04-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "characters",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), unique=True, nullable=False),
        sa.Column("archetype", sa.String(), nullable=False),
        sa.Column("core_flaw", sa.Text(), nullable=False),
        sa.Column("taboos", JSONB(), server_default="[]"),
        sa.Column("catchphrases", JSONB(), server_default="[]"),
        sa.Column("language_style", sa.Text(), nullable=False),
        sa.Column("safety_rules", JSONB(), server_default="{}"),
        sa.Column("canon_version", sa.Integer(), server_default="1"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "voice_profiles",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("character_id", sa.String(), sa.ForeignKey("characters.id"), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("voice_id", sa.String(), nullable=False),
        sa.Column("settings", JSONB(), server_default="{}"),
        sa.Column("emotional_tags", JSONB(), server_default="[]"),
        sa.Column("consent_verified", sa.Boolean(), server_default="false"),
        sa.Column("consent_evidence_uri", sa.String(), nullable=True),
    )

    op.create_table(
        "formats",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), unique=True, nullable=False),
        sa.Column("hook_template", sa.Text(), nullable=False),
        sa.Column("beat_sheet", JSONB(), server_default="[]"),
        sa.Column("length_min_seconds", sa.Integer(), nullable=False),
        sa.Column("length_max_seconds", sa.Integer(), nullable=False),
        sa.Column("ending_pattern", sa.Text(), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1"),
    )

    op.create_table(
        "episodes",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("character_id", sa.String(), sa.ForeignKey("characters.id"), nullable=False),
        sa.Column("format_id", sa.String(), sa.ForeignKey("formats.id"), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("DRAFT", "SCRIPTING", "VOICE", "VIDEO", "QA", "PUBLISHED", "FAILED", name="episodestatus"),
            server_default="DRAFT",
        ),
        sa.Column("attempt_counts", JSONB(), server_default='{"script":0,"voice":0,"video":0,"repair":0}'),
        sa.Column("scores", JSONB(), server_default="{}"),
        sa.Column("publish_targets", JSONB(), server_default="[]"),
        sa.Column("published_ids", JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "assets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("episode_id", sa.String(), sa.ForeignKey("episodes.id"), nullable=False),
        sa.Column(
            "asset_type",
            sa.Enum("SCRIPT", "AUDIO", "VIDEO", "SUBTITLE", "MASK", "FINAL", name="assettype"),
            nullable=False,
        ),
        sa.Column("uri", sa.String(), nullable=False),
        sa.Column("file_hash", sa.String(), nullable=True),
        sa.Column("model_settings", JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "memory_entries",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("character_id", sa.String(), sa.ForeignKey("characters.id"), nullable=True),
        sa.Column("episode_id", sa.String(), sa.ForeignKey("episodes.id"), nullable=True),
        sa.Column(
            "entry_type",
            sa.Enum("CANON", "EPISODIC", "FEEDBACK", "FIX", "PROMPT", name="memoryentrytype"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("embedding", Vector(1536), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "scorecards",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("episode_id", sa.String(), sa.ForeignKey("episodes.id"), nullable=False),
        sa.Column(
            "stage",
            sa.Enum("PRE_RENDER", "POST_RENDER", "POST_PUBLISH", name="scorecardstage"),
            nullable=False,
        ),
        sa.Column("metrics", JSONB(), server_default="{}"),
        sa.Column("judge_model", sa.String(), nullable=False),
        sa.Column("human_notes", sa.Text(), nullable=True),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Create index for vector similarity search
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_memory_entries_embedding "
        "ON memory_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_memory_entries_embedding")
    op.drop_table("scorecards")
    op.drop_table("memory_entries")
    op.drop_table("assets")
    op.drop_table("episodes")
    op.drop_table("formats")
    op.drop_table("voice_profiles")
    op.drop_table("characters")
    op.execute("DROP TYPE IF EXISTS episodestatus")
    op.execute("DROP TYPE IF EXISTS assettype")
    op.execute("DROP TYPE IF EXISTS memoryentrytype")
    op.execute("DROP TYPE IF EXISTS scorecardstage")
    op.execute("DROP EXTENSION IF EXISTS vector")
