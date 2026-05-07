from __future__ import annotations

from google import genai
from google.genai import types
from worker.config import settings

# gemini-embedding-001: text-only, 768-dim output, free tier, v1beta endpoint
_MODEL = "gemini-embedding-001"
_OUTPUT_DIM = 768
# embed_content accepts a list of contents in one call; keep batches small to
# stay within request-size limits and allow key rotation.
_BATCH_SIZE = 20


class EmbedderService:
    def __init__(self):
        self._clients: dict[str, genai.Client] = {}

    def _get_client(self, api_key: str) -> genai.Client:
        if api_key not in self._clients:
            self._clients[api_key] = genai.Client(api_key=api_key)
        return self._clients[api_key]

    def embed(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of texts using client.models.embed_content with a list of
        Content objects. Splits into chunks of _BATCH_SIZE and round-robins
        across available API keys.
        Returns a list of embedding vectors in the same order as input texts.
        """
        api_keys = settings.get_gemini_keys()
        if not api_keys:
            raise RuntimeError(
                "[embedder] No Gemini API key configured. "
                "Set GEMINI_API_KEY or GEMINI_API_KEYS in the worker environment."
            )

        results: list[list[float]] = []

        for batch_idx, start in enumerate(range(0, len(texts), _BATCH_SIZE)):
            batch = texts[start : start + _BATCH_SIZE]
            # Round-robin key per batch
            api_key = api_keys[batch_idx % len(api_keys)]
            client = self._get_client(api_key)

            # embed_content accepts a list of Content objects for multi-text embedding
            contents = [
                types.Content(parts=[types.Part(text=t)])
                for t in batch
            ]
            response = client.models.embed_content(
                model=_MODEL,
                contents=contents,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=_OUTPUT_DIM,
                ),
            )

            for i, emb in enumerate(response.embeddings):
                if emb.values is None:
                    raise ValueError(
                        f"[embedder] Embedding at batch {batch_idx}, index {i} "
                        f"(text: {batch[i][:60]!r}) returned None values."
                    )
                results.append(list(emb.values))

        return results


embedder = EmbedderService()
