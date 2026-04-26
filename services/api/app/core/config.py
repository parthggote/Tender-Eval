from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    auth_secret: str = "changeme"
    internal_database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/tendereval"
    )
    redis_url: str = "redis://localhost:6379/0"
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket: str = "tendereval"
    gemini_api_key: str = ""

    @field_validator("internal_database_url", "redis_url", "auth_secret",
                     "supabase_url", "supabase_service_key", "gemini_api_key", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_prefix="",
        case_sensitive=False,
    )


settings = Settings()
