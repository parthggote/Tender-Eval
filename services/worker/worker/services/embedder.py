from __future__ import annotations

from google import genai
from google.genai import types
from worker.config import settings


class EmbedderService:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            # http_options forces v1 endpoint — text-embedding-004 is not on v1beta
            self._client = genai.Client(
                api_key=settings.gemini_api_key,
                http_options={"api_version": "v1"},
            )
        return self._client

    def embed(self, texts: list[str]) -> list[list[float]]:
        results = []
        for text in texts:
            response = self.client.models.embed_content(
                model="text-embedding-004",
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            results.append(response.embeddings[0].values)
        return results


embedder = EmbedderService()
