"""Local (and S3-ready) file storage client."""

import os
from pathlib import Path


class StorageClient:
    def __init__(self, base_path: str = "./outputs", s3_bucket: str | None = None):
        self.base_path = Path(base_path)
        self.s3_bucket = s3_bucket

    async def save(self, data: bytes, category: str, filename: str) -> str:
        if self.s3_bucket:
            return await self._save_s3(data, category, filename)
        return await self._save_local(data, category, filename)

    async def _save_local(self, data: bytes, category: str, filename: str) -> str:
        dir_path = self.base_path / category
        dir_path.mkdir(parents=True, exist_ok=True)
        file_path = dir_path / filename
        file_path.write_bytes(data)
        return f"file://{file_path.resolve()}"

    async def _save_s3(self, data: bytes, category: str, filename: str) -> str:
        import aioboto3

        session = aioboto3.Session()
        key = f"{category}/{filename}"
        async with session.client("s3") as s3:
            await s3.put_object(Bucket=self.s3_bucket, Key=key, Body=data)
        return f"s3://{self.s3_bucket}/{key}"

    async def load(self, uri: str) -> bytes:
        if uri.startswith("s3://"):
            return await self._load_s3(uri)
        path = uri.replace("file://", "")
        return Path(path).read_bytes()

    async def _load_s3(self, uri: str) -> bytes:
        import aioboto3

        parts = uri.replace("s3://", "").split("/", 1)
        bucket, key = parts[0], parts[1]
        session = aioboto3.Session()
        async with session.client("s3") as s3:
            response = await s3.get_object(Bucket=bucket, Key=key)
            return await response["Body"].read()

    async def list_assets(self, episode_id: str) -> list[str]:
        results = []
        if self.s3_bucket:
            import aioboto3

            session = aioboto3.Session()
            async with session.client("s3") as s3:
                paginator = s3.get_paginator("list_objects_v2")
                async for page in paginator.paginate(Bucket=self.s3_bucket, Prefix=episode_id):
                    for obj in page.get("Contents", []):
                        results.append(f"s3://{self.s3_bucket}/{obj['Key']}")
        else:
            for category_dir in self.base_path.iterdir():
                if category_dir.is_dir():
                    for f in category_dir.iterdir():
                        if episode_id in f.name:
                            results.append(f"file://{f.resolve()}")
        return results
