"""add auth.js user tables

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "User",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(64), nullable=True),
        sa.Column("email", sa.String(255), nullable=True, unique=True),
        sa.Column("emailVerified", sa.DateTime(timezone=True), nullable=True),
        sa.Column("image", sa.String(2048), nullable=True),
        sa.Column("passwordHash", sa.String(255), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updatedAt", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        if_not_exists=True,
    )

    op.create_table(
        "Account",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("userId", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("User.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.Text, nullable=False),
        sa.Column("provider", sa.Text, nullable=False),
        sa.Column("providerAccountId", sa.Text, nullable=False),
        sa.Column("refresh_token", sa.Text, nullable=True),
        sa.Column("access_token", sa.Text, nullable=True),
        sa.Column("expires_at", sa.Integer, nullable=True),
        sa.Column("token_type", sa.Text, nullable=True),
        sa.Column("scope", sa.Text, nullable=True),
        sa.Column("id_token", sa.Text, nullable=True),
        sa.Column("session_state", sa.Text, nullable=True),
        sa.UniqueConstraint("provider", "providerAccountId"),
        if_not_exists=True,
    )
    op.create_index("Account_userId_idx", "Account", ["userId"], if_not_exists=True)

    op.create_table(
        "Session",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("sessionToken", sa.Text, nullable=False, unique=True),
        sa.Column("userId", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("User.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expires", sa.DateTime(timezone=True), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updatedAt", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        if_not_exists=True,
    )
    op.create_index("Session_userId_idx", "Session", ["userId"], if_not_exists=True)

    op.create_table(
        "VerificationToken",
        sa.Column("identifier", sa.Text, nullable=False),
        sa.Column("token", sa.Text, nullable=False, unique=True),
        sa.Column("expires", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("identifier", "token"),
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_table("VerificationToken")
    op.drop_index("Session_userId_idx", table_name="Session")
    op.drop_table("Session")
    op.drop_index("Account_userId_idx", table_name="Account")
    op.drop_table("Account")
    op.drop_table("User")
