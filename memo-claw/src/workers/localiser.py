"""Localisation worker — re-performs content for target cultures."""

from src.tools.claude_client import ClaudeClient

CULTURE_PROFILES = {
    "th": {
        "language": "Thai",
        "humour_style": "more playful and expressive",
        "pacing": "slightly faster rhythm",
        "exaggeration": "slightly more exaggerated",
        "emotion": "stronger emotional expression",
        "tone": "more conversational",
        "notes": "Content must feel native Thai, not translated. Use Thai comedy timing and cultural references.",
    },
    "ja": {
        "language": "Japanese",
        "humour_style": "tsukkomi/boke dynamic where applicable",
        "pacing": "precise timing",
        "exaggeration": "controlled escalation",
        "emotion": "expressed through contrast",
        "tone": "polite surface with chaotic undertones",
        "notes": "Adapt character archetypes to feel familiar in Japanese comedy traditions.",
    },
}


class Localiser:
    def __init__(self, claude: ClaudeClient):
        self.claude = claude

    async def localise(self, script: dict, character: dict, target_lang: str) -> dict:
        """Re-perform (NOT translate) a script for target culture."""
        culture = CULTURE_PROFILES.get(target_lang)
        if not culture:
            raise ValueError(f"No culture profile for {target_lang}")

        result = await self.claude.localise_script(
            script, character, culture["language"], self._build_culture_notes(culture)
        )
        return {
            "original": script,
            "localised": result["localised_script"],
            "language": target_lang,
            "adaptation_notes": result["adaptation_notes"],
            "culture_profile_used": culture,
        }

    def _build_culture_notes(self, culture: dict) -> str:
        notes = f"Target: {culture['language']}\n"
        notes += f"Humour: {culture['humour_style']}\n"
        notes += f"Pacing: {culture['pacing']}\n"
        notes += f"Exaggeration: {culture['exaggeration']}\n"
        notes += f"Emotion: {culture['emotion']}\n"
        notes += f"Tone: {culture['tone']}\n"
        notes += f"Key notes: {culture['notes']}"
        return notes
