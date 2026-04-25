"""add document page

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-22 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001_initial'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create document_page table
    op.create_table(
        'document_page',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_kind', sa.String(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('ocr_confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_document_page_document_id', 'document_page', ['document_id'])

def downgrade() -> None:
    op.drop_index('ix_document_page_document_id', table_name='document_page')
    op.drop_table('document_page')
