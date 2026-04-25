from __future__ import annotations
import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    internal_database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/tendereval"
    )

    # Supabase (storage + vector DB via pgvector)
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket: str = "tendereval"

    gemini_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        extra="ignore",
        env_prefix="",
        case_sensitive=False,
    )


settings = Settings()
