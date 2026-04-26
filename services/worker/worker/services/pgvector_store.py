from __future__ import annotations

import uuid
from sqlalchemy import text
from worker.config import settings

_engine = None
_SessionLocal = None

def _get_session():
    global _engine, _SessionLocal
    if _SessionLocal is None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        _engine = create_engine(settings.internal_database_url, pool_pre_ping=True)
        _SessionLocal = sessionmaker(bind=_engine)
    return _SessionLocal()


class PgVectorStore:
    """Stores and searches 768-dim embeddings (Gemini gemini-embedding-001) in Postgres via pgvector."""

    def upsert_passages(self, bidder_id: str, document_id: str, passages: list[dict]):
        with _get_session() as db:
            for p in passages:
                # Use CAST() instead of ::vector to avoid SQLAlchemy parsing :: as param separator
                db.execute(
                    text("""
                        INSERT INTO passage_embedding
                            (id, bidder_id, document_id, page_number, passage_text, embedding)
                        VALUES
                            (:id, :bidder_id, :document_id, :page_number, :passage_text,
                             CAST(:embedding AS vector))
                        ON CONFLICT (id) DO NOTHING
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "bidder_id": bidder_id,
                        "document_id": document_id,
                        "page_number": p["page_number"],
                        "passage_text": p["text"],
                        "embedding": str(p["embedding"]),
                    },
                )
            db.commit()

    def search(self, bidder_id: str, query_vector: list[float], limit: int = 5) -> list[dict]:
        with _get_session() as db:
            rows = db.execute(
                text("""
                    SELECT passage_text, page_number, document_id,
                           1 - (embedding <=> CAST(:query AS vector)) AS score
                    FROM passage_embedding
                    WHERE bidder_id = :bidder_id
                    ORDER BY embedding <=> CAST(:query AS vector)
                    LIMIT :limit
                """),
                {
                    "query": str(query_vector),
                    "bidder_id": bidder_id,
                    "limit": limit,
                },
            ).fetchall()

        return [
            {"text": row.passage_text, "page_number": row.page_number, "document_id": row.document_id}
            for row in rows
        ]


pgvector_store = PgVectorStore()
