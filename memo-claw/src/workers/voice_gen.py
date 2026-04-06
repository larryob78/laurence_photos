"""Voice generation worker."""

from src.tools.elevenlabs_client import ElevenLabsClient
from src.tools.storage import StorageClient


class VoiceGenerator:
    def __init__(self, elevenlabs: ElevenLabsClient, storage: StorageClient):
        self.elevenlabs = elevenlabs
        self.storage = storage

    async def generate(self, text: str, voice_id: str, episode_id: str, settings: dict | None = None) -> str:
        audio = await self.elevenlabs.generate_voice(text, voice_id, settings)
        return await self.elevenlabs.save_audio(audio, episode_id, self.storage)
