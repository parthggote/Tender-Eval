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
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    def embed(self, texts: list[str]) -> list[list[float]]:
        results = []
        for text in texts:
            response = self.client.models.embed_content(
                model="models/text-embedding-004",  # 768-dim, free tier
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            results.append(response.embeddings[0].values)
        return results


embedder = EmbedderService()
