"""Script writer worker — thin wrapper around ClaudeClient for job use."""

from src.tools.claude_client import ClaudeClient


class ScriptWriter:
    def __init__(self, claude: ClaudeClient):
        self.claude = claude

    async def generate(
        self, character: dict, format: dict, question: str, memory_context: str, num_variations: int = 5
    ) -> list[dict]:
        return await self.claude.write_script(character, format, question, memory_context, num_variations)

    async def score(self, script: dict, character: dict, format: dict) -> dict:
        return await self.claude.score_script(script, character, format)
