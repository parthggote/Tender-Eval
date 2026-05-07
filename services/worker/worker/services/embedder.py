from __future__ import annotations

import re
import time

from google import genai
from google.genai import types
from worker.config import settings
from worker.services.gemini_gate import gemini_embed_gate

# Default: gemini-embedding-001 (text-only, 768-dim output)
_MODEL = settings.gemini_embedding_model
_OUTPUT_DIM = 768
# embed_content accepts a list of contents in one call; keep batches small to
# stay within request-size limits and allow key rotation.
_BATCH_SIZE = 20
_RETRYABLE_RE = re.compile(r"(429|RESOURCE_EXHAUSTED|503|UNAVAILABLE)", re.IGNORECASE)


def _parse_retry_delay(error_msg: str) -> int | None:
    m = re.search(r"['\"]retryDelay['\"]\s*:\s*['\"](\d+(?:\.\d+)?)s['\"]", error_msg)
    if m:
        return int(float(m.group(1))) + 1
    m = re.search(r"retry in (\d+(?:\.\d+)?)s", error_msg, re.IGNORECASE)
    if m:
        return int(float(m.group(1))) + 1
    return None


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
            response = None

            # embed_content accepts a list of Content objects for multi-text embedding
            contents = [
                types.Content(parts=[types.Part(text=t)])
                for t in batch
            ]

            # Retry a couple times and rotate keys (useful when keys come from different projects).
            for attempt in range(3):
                api_key = api_keys[(batch_idx + attempt) % len(api_keys)]
                client = self._get_client(api_key)
                try:
                    gemini_embed_gate.wait_turn()
                    response = client.models.embed_content(
                        model=_MODEL,
                        contents=contents,
                        config=types.EmbedContentConfig(
                            task_type="RETRIEVAL_DOCUMENT",
                            output_dimensionality=_OUTPUT_DIM,
                        ),
                    )
                    break
                except Exception as e:
                    msg = str(e)
                    if not _RETRYABLE_RE.search(msg):
                        raise
                    suggested = _parse_retry_delay(msg)
                    wait = min(suggested if suggested else (attempt + 1) * 10, 60)
                    gemini_embed_gate.set_cooldown(wait)
                    time.sleep(wait)

            if response is None:
                raise RuntimeError("[embedder] embed_content failed after retries")

            for i, emb in enumerate(response.embeddings):
                if emb.values is None:
                    raise ValueError(
                        f"[embedder] Embedding at batch {batch_idx}, index {i} "
                        f"(text: {batch[i][:60]!r}) returned None values."
                    )
                results.append(list(emb.values))

        return results


embedder = EmbedderService()
