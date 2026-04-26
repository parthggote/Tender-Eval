"""add pgvector passage_embedding table

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension (Supabase has it pre-installed)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "passage_embedding",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("bidder_id", sa.String(255), nullable=False),
        sa.Column("document_id", sa.String(255), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("passage_text", sa.Text(), nullable=False),
        sa.Column("embedding", sa.Text(), nullable=False),
        if_not_exists=True,
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_passage_embedding_bidder_id ON passage_embedding (bidder_id)")

    # Use raw SQL for the vector column type and HNSW index
    op.execute("ALTER TABLE passage_embedding ALTER COLUMN embedding TYPE vector(768) USING embedding::vector(768)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_passage_embedding_hnsw ON passage_embedding USING hnsw (embedding vector_cosine_ops)")


def downgrade() -> None:
    op.drop_index("ix_passage_embedding_hnsw", table_name="passage_embedding")
    op.drop_index("ix_passage_embedding_bidder_id", table_name="passage_embedding")
    op.drop_table("passage_embedding")
