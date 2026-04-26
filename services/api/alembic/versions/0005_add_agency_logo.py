"""add agency logo url

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "agency_workspace",
        sa.Column("logo_url", sa.String(2048), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("agency_workspace", "logo_url")
