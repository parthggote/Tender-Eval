from __future__ import annotations

from supabase import create_client, Client
from worker.config import settings


class StorageService:
    def __init__(self):
        self.client: Client = create_client(settings.supabase_url, settings.supabase_service_key)
        self.bucket = settings.supabase_bucket

    def download_file(self, object_name: str) -> bytes:
        return self.client.storage.from_(self.bucket).download(object_name)

    def upload_file(self, object_name: str, data: bytes, content_type: str = "application/pdf"):
        self.client.storage.from_(self.bucket).upload(
            path=object_name,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"},
        )


storage_service = StorageService()
