"""ElevenLabs text-to-speech client."""

import asyncio
import logging
import time

import httpx

logger = logging.getLogger(__name__)

DEFAULT_VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.5,
}


class ElevenLabsClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"

    async def generate_voice(
        self, text: str, voice_id: str, settings: dict | None = None
    ) -> bytes:
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        body = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": settings or DEFAULT_VOICE_SETTINGS,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            for attempt in range(3):
                try:
                    response = await client.post(url, headers=headers, json=body)
                    if response.status_code == 429:
                        retry_after = float(response.headers.get("retry-after", 2 ** (attempt + 1)))
                        logger.warning(f"Rate limited, waiting {retry_after}s")
                        await asyncio.sleep(retry_after)
                        continue
                    response.raise_for_status()
                    return response.content
                except httpx.HTTPStatusError:
                    if attempt == 2:
                        raise
                    wait = 2 ** (attempt + 1)
                    logger.warning(f"HTTP error, retrying in {wait}s")
                    await asyncio.sleep(wait)

        raise RuntimeError("Failed to generate voice after 3 attempts")

    async def save_audio(self, audio_bytes: bytes, episode_id: str, storage) -> str:
        timestamp = int(time.time())
        filename = f"{episode_id}_voice_{timestamp}.mp3"
        return await storage.save(audio_bytes, "audio", filename)
