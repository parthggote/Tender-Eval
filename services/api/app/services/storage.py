from __future__ import annotations

from datetime import timedelta
from supabase import create_client, Client
from app.core.config import settings


class StorageService:
    def __init__(self):
        self.client: Client = create_client(settings.supabase_url, settings.supabase_service_key)
        self.bucket = settings.supabase_bucket

    def upload_file(self, object_name: str, data: bytes, content_type: str = "application/pdf"):
        self.client.storage.from_(self.bucket).upload(
            path=object_name,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    def get_signed_url(self, object_name: str, expires_minutes: int = 30) -> str:
        res = self.client.storage.from_(self.bucket).create_signed_url(
            path=object_name,
            expires_in=expires_minutes * 60,
        )
        return res["signedURL"]


storage_service = StorageService()
