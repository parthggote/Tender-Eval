"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-22
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agency_workspace",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_agency_workspace_slug", "agency_workspace", ["slug"])

    op.create_table(
        "agency_membership",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "agency_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agency_workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_agency_membership_agency_id", "agency_membership", ["agency_id"])
    op.create_index("ix_agency_membership_user_id", "agency_membership", ["user_id"])
    op.create_index(
        "ux_agency_membership_unique",
        "agency_membership",
        ["agency_id", "user_id"],
        unique=True,
    )

    op.create_table(
        "tender",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "agency_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agency_workspace.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("reference", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_tender_agency_id", "tender", ["agency_id"])

    op.create_table(
        "tender_document",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("object_key", sa.String(length=1024), nullable=False),
        sa.Column("original_filename", sa.String(length=1024), nullable=True),
        sa.Column("ocr_confidence_avg", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_tender_document_tender_id", "tender_document", ["tender_id"])

    op.create_table(
        "bidder",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_bidder_tender_id", "bidder", ["tender_id"])

    op.create_table(
        "bidder_document",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "bidder_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bidder.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("object_key", sa.String(length=1024), nullable=False),
        sa.Column("original_filename", sa.String(length=1024), nullable=True),
        sa.Column("ocr_confidence_avg", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_bidder_document_bidder_id", "bidder_document", ["bidder_id"])

    op.create_table(
        "criterion_extraction_run",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("model", sa.String(length=255), nullable=True),
        sa.Column("disagreements", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_criterion_extraction_run_tender_id",
        "criterion_extraction_run",
        ["tender_id"],
    )

    op.create_table(
        "criterion",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=64), nullable=False),
        sa.Column("threshold", sa.String(length=255), nullable=True),
        sa.Column("mandatory", sa.Boolean(), nullable=False),
        sa.Column("source_page", sa.Integer(), nullable=True),
        sa.Column("document_required", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_criterion_tender_id", "criterion", ["tender_id"])

    op.create_table(
        "evidence_passage",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "bidder_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bidder.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "criterion_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("criterion.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_document_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("passage", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("extracted", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_evidence_passage_bidder_id", "evidence_passage", ["bidder_id"])
    op.create_index("ix_evidence_passage_criterion_id", "evidence_passage", ["criterion_id"])

    op.create_table(
        "evaluation_run",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_evaluation_run_tender_id", "evaluation_run", ["tender_id"])

    op.create_table(
        "criterion_evaluation",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "evaluation_run_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("evaluation_run.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "bidder_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bidder.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "criterion_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("criterion.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("verdict", sa.String(length=64), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("evidence_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_criterion_evaluation_evaluation_run_id",
        "criterion_evaluation",
        ["evaluation_run_id"],
    )
    op.create_index(
        "ix_criterion_evaluation_bidder_id", "criterion_evaluation", ["bidder_id"]
    )
    op.create_index(
        "ix_criterion_evaluation_criterion_id",
        "criterion_evaluation",
        ["criterion_id"],
    )

    op.create_table(
        "review_case",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "bidder_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bidder.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "criterion_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("criterion.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_review_case_tender_id", "review_case", ["tender_id"])
    op.create_index("ix_review_case_bidder_id", "review_case", ["bidder_id"])
    op.create_index("ix_review_case_criterion_id", "review_case", ["criterion_id"])

    op.create_table(
        "review_decision",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "review_case_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("review_case.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("actor_user_id", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("final_verdict", sa.String(length=64), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_review_decision_review_case_id", "review_decision", ["review_case_id"]
    )

    op.create_table(
        "clarification_request",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "bidder_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bidder.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("criterion_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("letter_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_clarification_request_tender_id", "clarification_request", ["tender_id"]
    )
    op.create_index(
        "ix_clarification_request_bidder_id", "clarification_request", ["bidder_id"]
    )

    op.create_table(
        "report_export",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tender_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tender.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("object_key", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_report_export_tender_id", "report_export", ["tender_id"])

    op.create_table(
        "audit_entry",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("agency_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("tender_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("actor_user_id", sa.String(length=255), nullable=True),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.dialects.postgresql.JSONB(), nullable=False),
        sa.Column("prev_hash", sa.String(length=64), nullable=True),
        sa.Column("hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_entry_agency_id", "audit_entry", ["agency_id"])
    op.create_index("ix_audit_entry_tender_id", "audit_entry", ["tender_id"])
    op.create_index("ix_audit_entry_created_at", "audit_entry", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_report_export_tender_id", table_name="report_export")
    op.drop_table("report_export")

    op.drop_index("ix_clarification_request_bidder_id", table_name="clarification_request")
    op.drop_index("ix_clarification_request_tender_id", table_name="clarification_request")
    op.drop_table("clarification_request")

    op.drop_index("ix_review_decision_review_case_id", table_name="review_decision")
    op.drop_table("review_decision")

    op.drop_index("ix_review_case_criterion_id", table_name="review_case")
    op.drop_index("ix_review_case_bidder_id", table_name="review_case")
    op.drop_index("ix_review_case_tender_id", table_name="review_case")
    op.drop_table("review_case")

    op.drop_index("ix_criterion_evaluation_criterion_id", table_name="criterion_evaluation")
    op.drop_index("ix_criterion_evaluation_bidder_id", table_name="criterion_evaluation")
    op.drop_index("ix_criterion_evaluation_evaluation_run_id", table_name="criterion_evaluation")
    op.drop_table("criterion_evaluation")

    op.drop_index("ix_evaluation_run_tender_id", table_name="evaluation_run")
    op.drop_table("evaluation_run")

    op.drop_index("ix_evidence_passage_criterion_id", table_name="evidence_passage")
    op.drop_index("ix_evidence_passage_bidder_id", table_name="evidence_passage")
    op.drop_table("evidence_passage")

    op.drop_index("ix_criterion_tender_id", table_name="criterion")
    op.drop_table("criterion")

    op.drop_index("ix_criterion_extraction_run_tender_id", table_name="criterion_extraction_run")
    op.drop_table("criterion_extraction_run")

    op.drop_index("ix_bidder_document_bidder_id", table_name="bidder_document")
    op.drop_table("bidder_document")

    op.drop_index("ix_bidder_tender_id", table_name="bidder")
    op.drop_table("bidder")

    op.drop_index("ix_tender_document_tender_id", table_name="tender_document")
    op.drop_table("tender_document")

    op.drop_index("ix_audit_entry_created_at", table_name="audit_entry")
    op.drop_index("ix_audit_entry_tender_id", table_name="audit_entry")
    op.drop_index("ix_audit_entry_agency_id", table_name="audit_entry")
    op.drop_table("audit_entry")

    op.drop_index("ix_tender_agency_id", table_name="tender")
    op.drop_table("tender")

    op.drop_index("ux_agency_membership_unique", table_name="agency_membership")
    op.drop_index("ix_agency_membership_user_id", table_name="agency_membership")
    op.drop_index("ix_agency_membership_agency_id", table_name="agency_membership")
    op.drop_table("agency_membership")

    op.drop_index("ix_agency_workspace_slug", table_name="agency_workspace")
    op.drop_table("agency_workspace")
