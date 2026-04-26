from __future__ import annotations

from google import genai
from google.genai import types
from worker.config import settings

# gemini-embedding-001: text-only, 768-dim output, free tier, v1beta endpoint
_MODEL = "gemini-embedding-001"
_OUTPUT_DIM = 768


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
                model=_MODEL,
                contents=text,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=_OUTPUT_DIM,
                ),
            )
            results.append(response.embeddings[0].values)
        return results


embedder = EmbedderService()
