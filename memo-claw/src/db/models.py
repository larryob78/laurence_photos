import enum
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def gen_uuid():
    return str(uuid.uuid4())


class EpisodeStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCRIPTING = "SCRIPTING"
    VOICE = "VOICE"
    VIDEO = "VIDEO"
    QA = "QA"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"


class AssetType(str, enum.Enum):
    SCRIPT = "SCRIPT"
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"
    SUBTITLE = "SUBTITLE"
    MASK = "MASK"
    FINAL = "FINAL"


class MemoryEntryType(str, enum.Enum):
    CANON = "CANON"
    EPISODIC = "EPISODIC"
    FEEDBACK = "FEEDBACK"
    FIX = "FIX"
    PROMPT = "PROMPT"


class ScorecardStage(str, enum.Enum):
    PRE_RENDER = "PRE_RENDER"
    POST_RENDER = "POST_RENDER"
    POST_PUBLISH = "POST_PUBLISH"


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    archetype: Mapped[str] = mapped_column(String, nullable=False)
    core_flaw: Mapped[str] = mapped_column(Text, nullable=False)
    taboos: Mapped[dict] = mapped_column(JSONB, default=list)
    catchphrases: Mapped[dict] = mapped_column(JSONB, default=list)
    language_style: Mapped[str] = mapped_column(Text, nullable=False)
    safety_rules: Mapped[dict] = mapped_column(JSONB, default=dict)
    canon_version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    voice_profiles: Mapped[list["VoiceProfile"]] = relationship(back_populates="character")
    episodes: Mapped[list["Episode"]] = relationship(back_populates="character")
    memory_entries: Mapped[list["MemoryEntry"]] = relationship(back_populates="character")


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    character_id: Mapped[str] = mapped_column(ForeignKey("characters.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    voice_id: Mapped[str] = mapped_column(String, nullable=False)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    emotional_tags: Mapped[dict] = mapped_column(JSONB, default=list)
    consent_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_evidence_uri: Mapped[str | None] = mapped_column(String, nullable=True)

    character: Mapped["Character"] = relationship(back_populates="voice_profiles")


class Format(Base):
    __tablename__ = "formats"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hook_template: Mapped[str] = mapped_column(Text, nullable=False)
    beat_sheet: Mapped[dict] = mapped_column(JSONB, default=list)
    length_min_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    length_max_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    ending_pattern: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)

    episodes: Mapped[list["Episode"]] = relationship(back_populates="format")


class Episode(Base):
    __tablename__ = "episodes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    character_id: Mapped[str] = mapped_column(ForeignKey("characters.id"), nullable=False)
    format_id: Mapped[str] = mapped_column(ForeignKey("formats.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[EpisodeStatus] = mapped_column(Enum(EpisodeStatus), default=EpisodeStatus.DRAFT)
    attempt_counts: Mapped[dict] = mapped_column(JSONB, default=lambda: {"script": 0, "voice": 0, "video": 0, "repair": 0})
    scores: Mapped[dict] = mapped_column(JSONB, default=dict)
    publish_targets: Mapped[dict] = mapped_column(JSONB, default=list)
    published_ids: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    character: Mapped["Character"] = relationship(back_populates="episodes")
    format: Mapped["Format"] = relationship(back_populates="episodes")
    assets: Mapped[list["Asset"]] = relationship(back_populates="episode")
    memory_entries: Mapped[list["MemoryEntry"]] = relationship(back_populates="episode")
    scorecards: Mapped[list["Scorecard"]] = relationship(back_populates="episode")


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    episode_id: Mapped[str] = mapped_column(ForeignKey("episodes.id"), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(Enum(AssetType), nullable=False)
    uri: Mapped[str] = mapped_column(String, nullable=False)
    file_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    model_settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    episode: Mapped["Episode"] = relationship(back_populates="assets")


class MemoryEntry(Base):
    __tablename__ = "memory_entries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    character_id: Mapped[str | None] = mapped_column(ForeignKey("characters.id"), nullable=True)
    episode_id: Mapped[str | None] = mapped_column(ForeignKey("episodes.id"), nullable=True)
    entry_type: Mapped[MemoryEntryType] = mapped_column(Enum(MemoryEntryType), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    embedding = mapped_column(Vector(1536), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    character: Mapped["Character"] = relationship(back_populates="memory_entries")
    episode: Mapped["Episode"] = relationship(back_populates="memory_entries")


class Scorecard(Base):
    __tablename__ = "scorecards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    episode_id: Mapped[str] = mapped_column(ForeignKey("episodes.id"), nullable=False)
    stage: Mapped[ScorecardStage] = mapped_column(Enum(ScorecardStage), nullable=False)
    metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    judge_model: Mapped[str] = mapped_column(String, nullable=False)
    human_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    episode: Mapped["Episode"] = relationship(back_populates="scorecards")
