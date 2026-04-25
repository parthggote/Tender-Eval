from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.db.models import ProcessingStatus


class AgencyWorkspaceOut(BaseModel):
    id: str
    slug: str
    name: str


class TenderSummaryOut(BaseModel):
    id: str
    agencyId: str
    title: str
    reference: str | None = None
    createdAt: str


class TenderCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    reference: str | None = Field(default=None, max_length=255)
    description: str | None = None


class ReviewCaseOut(BaseModel):
    id: str
    tenderId: str
    bidderId: str
    criterionId: str
    status: str
    reason: str
    dueAt: str | None = None
    createdAt: str


class ReviewDecisionIn(BaseModel):
    action: str
    finalVerdict: str | None = None
    reason: str | None = None


class ReportExportOut(BaseModel):
    id: str
    tenderId: str
    status: ProcessingStatus
    createdAt: str
    objectKey: str | None = None


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat() + "Z"


class BidderCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=512)


class BidderOut(BaseModel):
    id: str
    tenderId: str
    name: str
    createdAt: str


class CriterionOut(BaseModel):
    id: str
    tenderId: str
    text: str
    type: str
    threshold: str | None = None
    mandatory: bool
    sourcePage: int | None = None
    confidence: float | None = None


class CriteriaExtractOut(BaseModel):
    extractionRunId: str
    taskId: str


class EvaluateOut(BaseModel):
    evaluation_run_id: str
    taskId: str


class TenderDocumentOut(BaseModel):
    id: str
    tenderId: str
    kind: str
    status: str
    objectKey: str
    originalFilename: str | None = None
    createdAt: str


class BidderDocumentOut(BaseModel):
    id: str
    bidderId: str
    kind: str
    status: str
    objectKey: str
    originalFilename: str | None = None
    createdAt: str


class EvaluationRunOut(BaseModel):
    id: str
    tenderId: str
    status: str
    createdAt: str
    finishedAt: str | None = None


class CriterionEvaluationOut(BaseModel):
    id: str
    evaluationRunId: str
    bidderId: str
    criterionId: str
    verdict: str
    confidence: float
    reason: str
    evidenceId: str | None = None
    createdAt: str


class JobStatusOut(BaseModel):
    taskId: str
    status: str
    result: dict | None = None


class SignedUrlOut(BaseModel):
    url: str
    expiresAt: str


class AuditEntryOut(BaseModel):
    id: str
    agencyId: str | None = None
    tenderId: str | None = None
    actorUserId: str | None = None
    action: str
    payload: dict
    prevHash: str | None = None
    hash: str
    createdAt: str
