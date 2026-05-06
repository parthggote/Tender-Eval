from __future__ import annotations
import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    internal_database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/tendereval"
    )
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket: str = "tendereval"
    gemini_api_key: str = ""
    # Comma-separated list of Gemini API keys for round-robin fallback.
    # If set, takes precedence over gemini_api_key.
    # Example: GEMINI_API_KEYS=key1,key2,key3
    gemini_api_keys: str = ""

    @field_validator("internal_database_url", "redis_url", "supabase_url",
                     "supabase_service_key", "gemini_api_key", "gemini_api_keys", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    def get_gemini_keys(self) -> list[str]:
        """
        Return a list of valid API keys.
        Prefers GEMINI_API_KEYS (comma-separated) over GEMINI_API_KEY.
        Falls back to GEMINI_API_KEY if GEMINI_API_KEYS is not set.
        """
        source = self.gemini_api_keys or self.gemini_api_key
        return [k.strip() for k in source.split(",") if k.strip()]

    def get_primary_gemini_key(self) -> str:
        """Return the first available API key, or empty string if none configured."""
        keys = self.get_gemini_keys()
        return keys[0] if keys else ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        extra="ignore",
        env_prefix="",
        case_sensitive=False,
    )


settings = Settings()
