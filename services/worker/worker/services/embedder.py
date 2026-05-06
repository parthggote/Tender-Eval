from __future__ import annotations

from google import genai
from google.genai import types
from worker.config import settings

# gemini-embedding-001: text-only, 768-dim output, free tier, v1beta endpoint
_MODEL = "gemini-embedding-001"
_OUTPUT_DIM = 768


class EmbedderService:
    def __init__(self):
        self._clients: dict[str, genai.Client] = {}

    def _get_client(self, api_key: str) -> genai.Client:
        if api_key not in self._clients:
            self._clients[api_key] = genai.Client(api_key=api_key)
        return self._clients[api_key]

    def embed(self, texts: list[str]) -> list[list[float]]:
        api_keys = settings.get_gemini_keys()
        if not api_keys:
            raise RuntimeError(
                "[embedder] No Gemini API key configured. "
                "Set GEMINI_API_KEY or GEMINI_API_KEYS in the worker environment."
            )

        results = []
        for i, text in enumerate(texts):
            # Round-robin across available keys
            api_key = api_keys[i % len(api_keys)]
            client = self._get_client(api_key)
            response = client.models.embed_content(
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
