from __future__ import annotations

from supabase import create_client, Client
from worker.config import settings


class StorageService:
    def __init__(self):
        self._client = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(settings.supabase_url, settings.supabase_service_key)
        return self._client

    @property
    def bucket(self):
        return settings.supabase_bucket

    def download_file(self, object_name: str) -> bytes:
        return self.client.storage.from_(self.bucket).download(object_name)

    def upload_file(self, object_name: str, data: bytes, content_type: str = "application/pdf"):
        self.client.storage.from_(self.bucket).upload(
            path=object_name,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"},
        )


storage_service = StorageService()
