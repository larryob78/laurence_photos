from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    runway_api_key: str = ""
    elevenlabs_api_key: str = ""
    database_url: str = "postgresql+asyncpg://memoclaw:memoclaw@localhost:5432/memoclaw"
    storage_base_path: str = "./outputs"
    s3_bucket: str | None = None

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
