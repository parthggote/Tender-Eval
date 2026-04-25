from __future__ import annotations

import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from worker.config import settings

engine = create_engine(settings.internal_database_url)
SessionLocal = sessionmaker(bind=engine)


class PgVectorStore:
    """Replaces QdrantStore — stores and searches 384-dim embeddings in Postgres via pgvector."""

    def upsert_passages(self, bidder_id: str, document_id: str, passages: list[dict]):
        with SessionLocal() as db:
            for p in passages:
                db.execute(
                    text("""
                        INSERT INTO passage_embedding
                            (id, bidder_id, document_id, page_number, passage_text, embedding)
                        VALUES
                            (:id, :bidder_id, :document_id, :page_number, :text, :embedding::vector)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "bidder_id": bidder_id,
                        "document_id": document_id,
                        "page_number": p["page_number"],
                        "text": p["text"],
                        "embedding": str(p["embedding"]),
                    },
                )
            db.commit()

    def search(self, bidder_id: str, query_vector: list[float], limit: int = 5) -> list[dict]:
        with SessionLocal() as db:
            rows = db.execute(
                text("""
                    SELECT passage_text, page_number, document_id,
                           1 - (embedding <=> :query::vector) AS score
                    FROM passage_embedding
                    WHERE bidder_id = :bidder_id
                    ORDER BY embedding <=> :query::vector
                    LIMIT :limit
                """),
                {
                    "query": str(query_vector),
                    "bidder_id": bidder_id,
                    "limit": limit,
                },
            ).fetchall()

        # Return objects that match the old Qdrant result shape (.payload["text"])
        return [
            _PassageResult(
                payload={
                    "text": row.passage_text,
                    "page_number": row.page_number,
                    "document_id": row.document_id,
                }
            )
            for row in rows
        ]


class _PassageResult:
    """Thin wrapper so existing task code (r.payload["text"]) keeps working unchanged."""
    def __init__(self, payload: dict):
        self.payload = payload


pgvector_store = PgVectorStore()
