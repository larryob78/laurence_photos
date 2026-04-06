"""Runway ML video generation client."""

import asyncio
import logging
import time

import httpx

logger = logging.getLogger(__name__)


class RunwayClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.dev.runwayml.com/v1"

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Runway-Version": "2024-11-06",
        }

    async def create_video_task(
        self, prompt: str, image_uri: str | None = None, duration: int = 10
    ) -> str:
        endpoint = "image_to_video" if image_uri else "text_to_video"
        url = f"{self.base_url}/{endpoint}"
        body = {"prompt": prompt, "duration": duration}
        if image_uri:
            body["image_uri"] = image_uri

        async with httpx.AsyncClient(timeout=30) as client:
            for attempt in range(3):
                response = await client.post(url, headers=self._headers(), json=body)
                if response.status_code == 429:
                    wait = 2 ** (attempt + 1)
                    logger.warning(f"Runway rate limited, waiting {wait}s")
                    await asyncio.sleep(wait)
                    continue
                response.raise_for_status()
                data = response.json()
                task_id = data.get("id") or data.get("task_id")
                logger.info(f"Created Runway task: {task_id}")
                return task_id

        raise RuntimeError("Failed to create Runway task after 3 attempts")

    async def poll_task(
        self, task_id: str, max_wait_seconds: int = 600, poll_interval: int = 10
    ) -> dict:
        url = f"{self.base_url}/tasks/{task_id}"
        elapsed = 0

        async with httpx.AsyncClient(timeout=30) as client:
            while elapsed < max_wait_seconds:
                response = await client.get(url, headers=self._headers())
                response.raise_for_status()
                data = response.json()
                status = data.get("status", "UNKNOWN")
                logger.info(f"Task {task_id}: {status} ({elapsed}s elapsed)")

                if status == "SUCCEEDED":
                    outputs = data.get("output") or []
                    output_url = outputs[0] if outputs else data.get("output_url")
                    if not output_url:
                        raise RuntimeError(f"Runway task {task_id} succeeded but returned no output URL")
                    return {
                        "status": status,
                        "output_url": output_url,
                        "failure_reason": None,
                    }
                elif status == "FAILED":
                    reason = data.get("failure", "Unknown failure")
                    raise RuntimeError(f"Runway task {task_id} failed: {reason}")
                # THROTTLED or RUNNING — keep waiting
                await asyncio.sleep(poll_interval)
                elapsed += poll_interval

        raise TimeoutError(f"Runway task {task_id} timed out after {max_wait_seconds}s")

    async def download_video(self, output_url: str, episode_id: str, storage) -> str:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.get(output_url)
            response.raise_for_status()
            filename = f"{episode_id}_video_{int(time.time())}.mp4"
            return await storage.save(response.content, "video", filename)

    async def create_and_wait(
        self, prompt: str, storage=None, image_uri: str | None = None, duration: int = 10
    ) -> dict:
        task_id = await self.create_video_task(prompt, image_uri, duration)
        result = await self.poll_task(task_id)
        if storage is None:
            raise ValueError("storage is required for create_and_wait")
        video_uri = await self.download_video(result["output_url"], task_id, storage)
        return {"task_id": task_id, "status": result["status"], "video_uri": video_uri}
