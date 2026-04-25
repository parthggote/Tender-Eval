from __future__ import annotations

from sentence_transformers import SentenceTransformer

class EmbedderService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

embedder = EmbedderService()
