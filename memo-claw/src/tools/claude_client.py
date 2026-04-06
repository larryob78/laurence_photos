"""Claude API client for script writing, scoring, and localisation."""

import asyncio
import json
import logging

import anthropic

logger = logging.getLogger(__name__)

SCRIPT_SYSTEM_PROMPT = """You are a comedy script engine for animated short-form content.

COMEDY ENGINE RULE: Humour = BELIEF vs REALITY. Characters must be serious. Outcomes contradict them. Escalation is required.

CHARACTER DNA:
{character_json}

FORMAT BEAT SHEET:
{format_json}

MEMORY CONTEXT (what happened before):
{memory_context}

Generate {num_variations} script variations as a JSON array. Each variation must follow this structure:
{{
  "variation_id": <int>,
  "hook": "<opening hook line>",
  "beats": [
    {{"beat_name": "<name>", "line": "<dialogue/action>", "character": "<who speaks/acts>"}}
  ],
  "twist": "<the surprise turn>",
  "loop_back": "<setup for next episode or loop>"
}}

Respond ONLY with the JSON array, no other text."""

SCORE_SYSTEM_PROMPT = """You are a ruthless comedy director. Score this script 1-10 on each dimension. Be harsh. Only 8+ should be produced.

Score each dimension:
- hook: How strong is the opening?
- clarity: Is the joke clear and land-able?
- character_consistency: Does the character stay true to their DNA?
- comedy_tension: Is there genuine tension between belief and reality?
- surprise: Is there a real twist?
- loop_potential: Does it set up re-watch or sequel?
- shareability: Would someone send this to a friend?

Respond as JSON:
{{
  "hook": <int>, "clarity": <int>, "character_consistency": <int>,
  "comedy_tension": <int>, "surprise": <int>, "loop_potential": <int>,
  "shareability": <int>, "average": <float>,
  "publish_recommendation": <bool (true only if average >= 7.5)>,
  "notes": "<brief critique>"
}}"""

LOCALISE_SYSTEM_PROMPT = """You are NOT translating. You are RE-PERFORMING this content for a {target_language} audience.

Adapt humour style, pacing, references, tone. The character must feel NATIVE, not translated.

Culture notes:
{culture_notes}

Original script:
{script_json}

Character:
{character_json}

Respond as JSON:
{{
  "localised_script": <same structure as original but re-performed>,
  "adaptation_notes": "<what you changed and why>"
}}"""


class ClaudeClient:
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    async def _call_with_retry(self, system: str, user: str, max_retries: int = 3) -> str:
        for attempt in range(max_retries):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=system,
                    messages=[{"role": "user", "content": user}],
                )
                if not response.content:
                    raise RuntimeError("Claude returned empty response content")
                return response.content[0].text
            except anthropic.RateLimitError as e:
                if attempt == max_retries - 1:
                    raise
                retry_after = float(e.response.headers.get("retry-after", 2 ** (attempt + 1)))
                logger.warning(f"Rate limited, retrying in {retry_after}s (attempt {attempt + 1})")
                await asyncio.sleep(retry_after)
            except anthropic.APIError as e:
                if attempt == max_retries - 1:
                    raise
                wait = 2 ** (attempt + 1)
                logger.warning(f"API error: {e}, retrying in {wait}s")
                await asyncio.sleep(wait)

    async def write_script(
        self,
        character: dict,
        format: dict,
        question: str,
        memory_context: str,
        num_variations: int = 5,
    ) -> list[dict]:
        system = SCRIPT_SYSTEM_PROMPT.format(
            character_json=json.dumps(character, indent=2),
            format_json=json.dumps(format, indent=2),
            memory_context=memory_context,
            num_variations=num_variations,
        )
        user_msg = f"Question/prompt for the episode: {question}"
        raw = await self._call_with_retry(system, user_msg)
        # Parse JSON from response (handle markdown code blocks)
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)

    async def score_script(self, script: dict, character: dict, format: dict) -> dict:
        system = SCORE_SYSTEM_PROMPT
        user_msg = (
            f"Script to score:\n{json.dumps(script, indent=2)}\n\n"
            f"Character:\n{json.dumps(character, indent=2)}\n\n"
            f"Format:\n{json.dumps(format, indent=2)}"
        )
        raw = await self._call_with_retry(system, user_msg)
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)

    async def localise_script(
        self, script: dict, character: dict, target_language: str, culture_notes: str
    ) -> dict:
        system = LOCALISE_SYSTEM_PROMPT.format(
            target_language=target_language,
            culture_notes=culture_notes,
            script_json=json.dumps(script, indent=2),
            character_json=json.dumps(character, indent=2),
        )
        user_msg = f"Re-perform this script for a {target_language} audience."
        raw = await self._call_with_retry(system, user_msg)
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
