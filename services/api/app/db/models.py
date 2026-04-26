from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OfficerRole(str, enum.Enum):
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
    PROCUREMENT_OFFICER = "PROCUREMENT_OFFICER"
    REVIEW_OFFICER = "REVIEW_OFFICER"
    COMMITTEE_MEMBER = "COMMITTEE_MEMBER"
    AUDITOR = "AUDITOR"


class CriterionType(str, enum.Enum):
    FINANCIAL = "FINANCIAL"
    TECHNICAL = "TECHNICAL"
    COMPLIANCE = "COMPLIANCE"
    CERTIFICATION = "CERTIFICATION"


class Verdict(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class ReviewAction(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    OVERRIDDEN = "OVERRIDDEN"
    ESCALATED = "ESCALATED"
    REQUESTED_CLARIFICATION = "REQUESTED_CLARIFICATION"


class ProcessingStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class DocumentKind(str, enum.Enum):
    TENDER = "TENDER"
    BIDDER_SUBMISSION = "BIDDER_SUBMISSION"
    CERTIFICATE = "CERTIFICATE"
    OTHER = "OTHER"


class AgencyWorkspace(Base):
    __tablename__ = "agency_workspace"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    logo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    memberships: Mapped[list["AgencyMembership"]] = relationship(back_populates="agency")
    tenders: Mapped[list["Tender"]] = relationship(back_populates="agency")


class AgencyMembership(Base):
    __tablename__ = "agency_membership"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agency_workspace.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    role: Mapped[str] = mapped_column(
        String(64), default=OfficerRole.PROCUREMENT_OFFICER.value
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    agency: Mapped[AgencyWorkspace] = relationship(back_populates="memberships")

    __table_args__ = (Index("ux_agency_membership_unique", "agency_id", "user_id", unique=True),)


class Tender(Base):
    __tablename__ = "tender"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agency_workspace.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(512))
    reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="DRAFT")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    agency: Mapped[AgencyWorkspace] = relationship(back_populates="tenders")
    documents: Mapped[list["TenderDocument"]] = relationship(back_populates="tender")
    bidders: Mapped[list["Bidder"]] = relationship(back_populates="tender")
    criteria: Mapped[list["Criterion"]] = relationship(back_populates="tender")


class TenderDocument(Base):
    __tablename__ = "tender_document"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(64), default=DocumentKind.TENDER.value)
    object_key: Mapped[str] = mapped_column(String(1024))
    original_filename: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    ocr_confidence_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(64), default=ProcessingStatus.PENDING.value
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    tender: Mapped[Tender] = relationship(back_populates="documents")


class Bidder(Base):
    __tablename__ = "bidder"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    tender: Mapped[Tender] = relationship(back_populates="bidders")
    documents: Mapped[list["BidderDocument"]] = relationship(back_populates="bidder")


class BidderDocument(Base):
    __tablename__ = "bidder_document"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidder.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(
        String(64), default=DocumentKind.BIDDER_SUBMISSION.value
    )
    object_key: Mapped[str] = mapped_column(String(1024))
    original_filename: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    ocr_confidence_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(64), default=ProcessingStatus.PENDING.value
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    bidder: Mapped[Bidder] = relationship(back_populates="documents")


class CriterionExtractionRun(Base):
    __tablename__ = "criterion_extraction_run"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(
        String(64), default=ProcessingStatus.PENDING.value
    )
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    disagreements: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Criterion(Base):
    __tablename__ = "criterion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(64))
    threshold: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    source_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    document_required: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    tender: Mapped[Tender] = relationship(back_populates="criteria")


class EvidencePassage(Base):
    __tablename__ = "evidence_passage"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidder.id", ondelete="CASCADE"), index=True)
    criterion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criterion.id", ondelete="CASCADE"), index=True)
    source_document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passage: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    extracted: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class EvaluationRun(Base):
    __tablename__ = "evaluation_run"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(
        String(64), default=ProcessingStatus.PENDING.value
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CriterionEvaluation(Base):
    __tablename__ = "criterion_evaluation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evaluation_run.id", ondelete="CASCADE"), index=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidder.id", ondelete="CASCADE"), index=True)
    criterion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criterion.id", ondelete="CASCADE"), index=True)
    verdict: Mapped[str] = mapped_column(String(64))
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(Text)
    evidence_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class ReviewCase(Base):
    __tablename__ = "review_case"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidder.id", ondelete="CASCADE"), index=True)
    criterion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criterion.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(64), default="OPEN")
    reason: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class ReviewDecision(Base):
    __tablename__ = "review_decision"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("review_case.id", ondelete="CASCADE"), index=True)
    actor_user_id: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(64))
    final_verdict: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class ClarificationRequest(Base):
    __tablename__ = "clarification_request"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidder.id", ondelete="CASCADE"), index=True)
    criterion_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="DRAFT")
    letter_text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class AuditEntry(Base):
    __tablename__ = "audit_entry"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    tender_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    actor_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(255))
    payload: Mapped[dict] = mapped_column(JSONB)
    prev_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)


class ReportExport(Base):
    __tablename__ = "report_export"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tender.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(
        String(64), default=ProcessingStatus.PENDING.value
    )
    object_key: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class DocumentPage(Base):
    __tablename__ = "document_page"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    document_kind: Mapped[str] = mapped_column(String(64))  # TENDER or BIDDER
    page_number: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    ocr_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
