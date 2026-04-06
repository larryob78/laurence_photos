"""Retry and simplify logic for the Director."""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def retry_with_backoff(coro_func, max_retries: int = 3, base_delay: float = 2.0):
    """Retry an async function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return await coro_func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt)
            logger.warning(f"Attempt {attempt + 1} failed: {e}, retrying in {delay}s")
            await asyncio.sleep(delay)


def simplify_prompt(prompt: str, reduction_level: int = 1) -> str:
    """Simplify a prompt to reduce complexity when retrying.

    Level 1: Remove detail, keep structure
    Level 2: Reduce to core elements only
    """
    if reduction_level >= 2:
        lines = prompt.split("\n")
        return "\n".join(line for line in lines[:5] if line.strip())
    # Level 1: trim long lines
    lines = prompt.split("\n")
    simplified = []
    for line in lines:
        if len(line) > 200:
            simplified.append(line[:200] + "...")
        else:
            simplified.append(line)
    return "\n".join(simplified)
