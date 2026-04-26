"""fix embedding dimension 384 -> 768 for Gemini text-embedding-004

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-26
"""
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old HNSW index first (can't alter column with index)
    op.execute("DROP INDEX IF EXISTS ix_passage_embedding_hnsw")
    # Resize vector column from 384 to 768 (Gemini text-embedding-004 output)
    op.execute(
        "ALTER TABLE passage_embedding "
        "ALTER COLUMN embedding TYPE vector(768) "
        "USING embedding::text::vector(768)"
    )
    # Recreate HNSW index with new dimension
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_passage_embedding_hnsw "
        "ON passage_embedding USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_passage_embedding_hnsw")
    op.execute(
        "ALTER TABLE passage_embedding "
        "ALTER COLUMN embedding TYPE vector(384) "
        "USING embedding::text::vector(384)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_passage_embedding_hnsw "
        "ON passage_embedding USING hnsw (embedding vector_cosine_ops)"
    )
