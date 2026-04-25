from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Shared secret with the officer portal for signed user context headers.
    auth_secret: str = "changeme"

    # Domain DB (tenders, criteria, audit, etc).
    internal_database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/tendereval"
    )

    redis_url: str = "redis://localhost:6379/0"

    # Supabase (storage + vector DB via pgvector)
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket: str = "tendereval"

    gemini_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_prefix="",
        case_sensitive=False,
    )


settings = Settings()
