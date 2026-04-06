"""Scoring worker — wraps the LLM-as-judge scoring."""

from src.tools.claude_client import ClaudeClient


class Scorer:
    def __init__(self, claude: ClaudeClient):
        self.claude = claude

    async def score(self, script: dict, character: dict, format: dict) -> dict:
        return await self.claude.score_script(script, character, format)

    def passes_threshold(self, score: dict, threshold: float = 7.5) -> bool:
        return score.get("average", 0) >= threshold
