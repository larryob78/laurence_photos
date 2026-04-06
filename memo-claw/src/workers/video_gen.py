"""Video generation worker."""

from src.tools.runway_client import RunwayClient
from src.tools.storage import StorageClient


class VideoGenerator:
    def __init__(self, runway: RunwayClient, storage: StorageClient):
        self.runway = runway
        self.storage = storage

    async def generate(self, prompt: str, episode_id: str, image_uri: str | None = None, duration: int = 10) -> dict:
        task_id = await self.runway.create_video_task(prompt, image_uri, duration)
        result = await self.runway.poll_task(task_id)
        video_uri = await self.runway.download_video(result["output_url"], episode_id, self.storage)
        return {"task_id": task_id, "status": result["status"], "video_uri": video_uri}
