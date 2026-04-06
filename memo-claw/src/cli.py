"""CLI for Memo Claw — primary interface during development."""

import asyncio

import click

from src.config import settings
from src.db.session import async_session_factory
from src.director.loop import Director
from src.director.state import JobState
from src.memory.wiki import CharacterWiki
from src.tools.claude_client import ClaudeClient
from src.tools.elevenlabs_client import ElevenLabsClient
from src.tools.runway_client import RunwayClient
from src.tools.storage import StorageClient


@click.group()
def cli():
    """Memo Claw — AI content pipeline for animated character episodes."""
    pass


@cli.command()
@click.option("--character", required=True, help="Character name (e.g. super-claws)")
@click.option("--question", required=True, help="Question/prompt for the episode")
@click.option("--format", "format_name", default="Super Claws Interrogation", help="Format name")
def run(character: str, question: str, format_name: str):
    """Run a single episode job end-to-end."""
    asyncio.run(_run_job(character, question, format_name))


async def _run_job(character_name: str, question: str, format_name: str):
    from sqlalchemy import select
    from src.db.models import Character, Format

    async with async_session_factory() as session:
        # Look up character
        result = await session.execute(select(Character).where(Character.name == character_name))
        char = result.scalar_one_or_none()
        if char is None:
            click.echo(f"Character '{character_name}' not found. Run 'memo-claw seed' first.")
            return

        # Look up format
        result = await session.execute(select(Format).where(Format.name == format_name))
        fmt = result.scalar_one_or_none()
        if fmt is None:
            click.echo(f"Format '{format_name}' not found.")
            return

        job = JobState(character_id=char.id, format_id=fmt.id, question=question)
        click.echo(f"Job {job.job_id} created. Starting pipeline...")

        director = Director(
            claude=ClaudeClient(settings.anthropic_api_key),
            elevenlabs=ElevenLabsClient(settings.elevenlabs_api_key),
            runway=RunwayClient(settings.runway_api_key),
            storage=StorageClient(settings.storage_base_path),
            wiki=CharacterWiki(session),
            db_session=session,
        )

        result = await director.run_job(job)
        click.echo(f"\nJob complete: {result.status.value}")
        click.echo(f"  Attempts: {result.attempts}")
        if result.scores.get("final_score"):
            click.echo(f"  Final score: {result.scores['final_score']['average']}")
        if result.error_log:
            click.echo(f"  Errors: {len(result.error_log)}")


@cli.command()
@click.option("--character", required=True)
@click.option("--questions-file", required=True, type=click.Path(exists=True))
@click.option("--format", "format_name", default="Super Claws Interrogation")
def batch(character: str, questions_file: str, format_name: str):
    """Run multiple jobs from a questions file (one per line)."""
    with open(questions_file) as f:
        questions = [line.strip() for line in f if line.strip()]
    click.echo(f"Running {len(questions)} jobs for {character}...")
    for i, q in enumerate(questions, 1):
        click.echo(f"\n--- Job {i}/{len(questions)}: {q[:60]} ---")
        asyncio.run(_run_job(character, q, format_name))


@cli.command()
@click.option("--job-id", required=True)
def status(job_id: str):
    """Show current job state."""
    asyncio.run(_show_status(job_id))


async def _show_status(job_id: str):
    from src.db.models import Episode

    async with async_session_factory() as session:
        episode = await session.get(Episode, job_id)
        if episode is None:
            click.echo("Job not found.")
            return
        click.echo(f"Job: {episode.id}")
        click.echo(f"  Status: {episode.status.value if episode.status else 'N/A'}")
        click.echo(f"  Question: {episode.question}")
        click.echo(f"  Attempts: {episode.attempt_counts}")
        click.echo(f"  Created: {episode.created_at}")


@cli.command()
def characters():
    """List all characters."""
    asyncio.run(_list_characters())


async def _list_characters():
    from sqlalchemy import select
    from src.db.models import Character

    async with async_session_factory() as session:
        result = await session.execute(select(Character))
        for char in result.scalars().all():
            click.echo(f"  {char.name} (v{char.canon_version}) — {char.archetype}")


@cli.command()
def seed():
    """Run the database seeder."""
    from src.db.seed import seed as run_seed
    asyncio.run(run_seed())


@cli.command()
@click.option("--character", required=True)
@click.option("--last", default=10, type=int)
def memory(character: str, last: int):
    """Show recent memory entries for a character."""
    asyncio.run(_show_memory(character, last))


async def _show_memory(character_name: str, limit: int):
    from sqlalchemy import select
    from src.db.models import Character, MemoryEntry

    async with async_session_factory() as session:
        result = await session.execute(select(Character).where(Character.name == character_name))
        char = result.scalar_one_or_none()
        if char is None:
            click.echo(f"Character '{character_name}' not found.")
            return

        result = await session.execute(
            select(MemoryEntry)
            .where(MemoryEntry.character_id == char.id)
            .order_by(MemoryEntry.created_at.desc())
            .limit(limit)
        )
        entries = result.scalars().all()
        if not entries:
            click.echo("No memory entries.")
            return
        for e in entries:
            click.echo(f"  [{e.entry_type.value}] {e.content[:80]}...")


if __name__ == "__main__":
    cli()
