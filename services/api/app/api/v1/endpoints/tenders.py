from __future__ import annotations

import re
import uuid
from datetime import datetime
from hashlib import sha256
import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_signed_user_context
from app.db.models import (
    AgencyMembership,
    AgencyWorkspace,
    AuditEntry,
    Bidder,
    BidderDocument,
    Criterion,
    CriterionEvaluation,
    CriterionExtractionRun,
    EvaluationRun,
    ReviewCase,
    Tender,
    TenderDocument,
)
from app.db.session import get_db
from app.schemas.dtos import (
    BidderCreateIn,
    BidderOut,
    CriteriaExtractOut,
    CriterionOut,
    EvaluateOut,
    TenderCreateIn,
    TenderSummaryOut,
    iso,
    TenderDocumentOut,
    BidderDocumentOut,
    EvaluationRunOut,
    CriterionEvaluationOut,
)
from app.services.storage import storage_service
from app.services.celery_dispatch import (
    dispatch_ocr,
    dispatch_criteria_extraction,
    dispatch_evaluation,
)

router = APIRouter()


def _append_audit_entry(
    db: Session,
    *,
    agency_id: uuid.UUID | None,
    tender_id: uuid.UUID | None,
    actor_user_id: str | None,
    action: str,
    payload: dict,
) -> None:
    last = db.execute(
        select(AuditEntry).where(AuditEntry.agency_id == agency_id).order_by(AuditEntry.created_at.desc())
    ).scalars().first()
    prev_hash = last.hash if last else None
    created_at = datetime.utcnow()
    payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    canonical = (
        f"{prev_hash or ''}|{created_at.isoformat()}|{actor_user_id or ''}|{action}|{payload_json}"
    ).encode("utf-8")
    entry_hash = sha256(canonical).hexdigest()
    db.add(
        AuditEntry(
            agency_id=agency_id,
            tender_id=tender_id,
            actor_user_id=actor_user_id,
            action=action,
            payload=payload,
            prev_hash=prev_hash,
            hash=entry_hash,
            created_at=created_at,
        )
    )
    db.commit()


def _require_agency_membership(db: Session, *, user_id: str, agency_id: uuid.UUID) -> None:
    membership = db.execute(
        select(AgencyMembership).where(
            AgencyMembership.user_id == user_id, AgencyMembership.agency_id == agency_id
        )
    ).scalars().first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this agency.")


def _require_tender_access(db: Session, *, user_id: str, tender_id: uuid.UUID) -> Tender:
    tender = db.get(Tender, tender_id)
    if not tender:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tender not found.")
    _require_agency_membership(db, user_id=user_id, agency_id=tender.agency_id)
    return tender


def _safe_filename(name: str) -> str:
    """Sanitize filename and deduplicate extensions (e.g. file.pdf.pdf → file.pdf)."""
    base = name.strip().replace("\\", "_").replace("/", "_")
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", base)
    base = base[:200] if base else "document"
    # Deduplicate repeated extensions: file.pdf.pdf → file.pdf
    stem = Path(base).stem
    suffix = Path(base).suffix.lower()
    if suffix and stem.lower().endswith(suffix):
        base = stem  # strip the duplicate
    return base


@router.delete("/agencies/{agency_slug}/tenders/{tender_id}")
def delete_tender(
    agency_slug: str,
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> dict:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid tender id.") from exc

    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    _append_audit_entry(
        db, agency_id=tender.agency_id, tender_id=tender_uuid,
        actor_user_id=user_id, action="DELETE_TENDER",
        payload={"tenderId": tender_id, "title": tender.title},
    )

    db.delete(tender)
    db.commit()
    return {"ok": True}


@router.get("/agencies/{agency_slug}/tenders", response_model=list[TenderSummaryOut])
def list_tenders_for_agency(
    agency_slug: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[TenderSummaryOut]:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )

    agency = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == agency_slug)).scalars().first()
    if not agency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency not found.")

    _require_agency_membership(db, user_id=user_id, agency_id=agency.id)

    tenders = db.execute(
        select(Tender).where(Tender.agency_id == agency.id).order_by(Tender.created_at.desc())
    ).scalars().all()

    return [
        TenderSummaryOut(
            id=str(t.id),
            agencyId=str(t.agency_id),
            title=t.title,
            reference=t.reference,
            createdAt=iso(t.created_at),
        )
        for t in tenders
    ]


@router.get("/tenders/{tender_id}", response_model=TenderSummaryOut)
def get_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> TenderSummaryOut:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )

    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    return TenderSummaryOut(
        id=str(tender.id),
        agencyId=str(tender.agency_id),
        title=tender.title,
        reference=tender.reference,
        createdAt=iso(tender.created_at),
    )


@router.post("/agencies/{agency_id_or_slug}/tenders", response_model=TenderSummaryOut)
def create_tender(
    agency_id_or_slug: str,
    body: TenderCreateIn,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> TenderSummaryOut:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )

    agency: AgencyWorkspace | None = None
    try:
        agency_uuid = uuid.UUID(agency_id_or_slug)
        agency = db.get(AgencyWorkspace, agency_uuid)
    except ValueError:
        agency = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == agency_id_or_slug)).scalars().first()

    if not agency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency not found.")

    _require_agency_membership(db, user_id=user_id, agency_id=agency.id)

    tender = Tender(
        agency_id=agency.id,
        title=body.title,
        reference=body.reference,
        description=body.description,
        status="DRAFT",
        created_at=datetime.utcnow(),
    )
    db.add(tender)
    db.commit()
    db.refresh(tender)

    _append_audit_entry(
        db,
        agency_id=agency.id,
        tender_id=tender.id,
        actor_user_id=user_id,
        action="CREATE_TENDER",
        payload={"tenderId": str(tender.id), "title": tender.title},
    )

    return TenderSummaryOut(
        id=str(tender.id),
        agencyId=str(tender.agency_id),
        title=tender.title,
        reference=tender.reference,
        createdAt=iso(tender.created_at),
    )


@router.post("/tenders/{tender_id}/documents")
def upload_tender_document(
    tender_id: str,
    file: UploadFile = File(...),
    kind: str = Form(default="TENDER"),
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> dict:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    name = _safe_filename(file.filename or "tender.pdf")
    object_key = f"tenders/{tender_id}/{uuid.uuid4()}_{name}"
    content = file.file.read()
    storage_service.upload_file(object_key, content, file.content_type or "application/pdf")

    doc = TenderDocument(
        tender_id=tender_uuid,
        kind=kind,
        object_key=object_key,
        original_filename=file.filename,
        status="PENDING",
        created_at=datetime.utcnow(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    dispatch_ocr(str(doc.id))

    _append_audit_entry(
        db,
        agency_id=tender.agency_id,
        tender_id=tender_uuid,
        actor_user_id=user_id,
        action="UPLOAD_TENDER_DOCUMENT",
        payload={"tenderId": tender_id, "documentId": str(doc.id), "objectKey": object_key},
    )

    return {"documentId": str(doc.id), "objectKey": object_key}


@router.delete("/tenders/{tender_id}/documents/{document_id}")
def delete_tender_document(
    tender_id: str,
    document_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> dict:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    doc_uuid = uuid.UUID(document_id)
    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    doc = db.get(TenderDocument, doc_uuid)
    if not doc or doc.tender_id != tender_uuid:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from storage
    try:
        storage_service.delete_file(doc.object_key)
    except Exception as e:
        print(f"[storage] delete failed for {doc.object_key}: {e}")

    db.delete(doc)
    db.commit()

    _append_audit_entry(
        db,
        agency_id=tender.agency_id,
        tender_id=tender_uuid,
        actor_user_id=user_id,
        action="DELETE_TENDER_DOCUMENT",
        payload={"tenderId": tender_id, "documentId": document_id},
    )

    return {"ok": True}


@router.post("/tenders/{tender_id}/criteria/extract", response_model=CriteriaExtractOut)
def extract_criteria(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> CriteriaExtractOut:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    run = CriterionExtractionRun(
        tender_id=tender_uuid,
        status="PENDING",
        created_at=datetime.utcnow(),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    task = dispatch_criteria_extraction(tender_id)

    _append_audit_entry(
        db,
        agency_id=tender.agency_id,
        tender_id=tender_uuid,
        actor_user_id=user_id,
        action="EXTRACT_CRITERIA",
        payload={"tenderId": tender_id, "extractionRunId": str(run.id), "taskId": task.id},
    )

    return CriteriaExtractOut(extractionRunId=str(run.id), taskId=task.id)


@router.get("/tenders/{tender_id}/criteria", response_model=list[CriterionOut])
def list_criteria(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[CriterionOut]:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    criteria = db.execute(select(Criterion).where(Criterion.tender_id == tender_uuid)).scalars().all()
    return [
        CriterionOut(
            id=str(c.id),
            tenderId=str(c.tender_id),
            text=c.text,
            type=c.type,
            threshold=c.threshold,
            mandatory=c.mandatory,
            sourcePage=c.source_page,
            confidence=c.confidence,
        )
        for c in criteria
    ]


@router.post("/tenders/{tender_id}/bidders", response_model=BidderOut)
def create_bidder(
    tender_id: str,
    body: BidderCreateIn,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> BidderOut:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    bidder = Bidder(
        tender_id=tender_uuid,
        name=body.name,
        created_at=datetime.utcnow(),
    )
    db.add(bidder)
    db.commit()
    db.refresh(bidder)

    _append_audit_entry(
        db,
        agency_id=tender.agency_id,
        tender_id=tender_uuid,
        actor_user_id=user_id,
        action="CREATE_BIDDER",
        payload={"tenderId": tender_id, "bidderId": str(bidder.id), "name": bidder.name},
    )

    return BidderOut(
        id=str(bidder.id),
        tenderId=str(bidder.tender_id),
        name=bidder.name,
        createdAt=iso(bidder.created_at),
    )


@router.post("/tenders/{tender_id}/bidders/{bidder_id}/documents")
def upload_bidder_document(
    tender_id: str,
    bidder_id: str,
    file: UploadFile = File(...),
    kind: str = Form(default="BIDDER_SUBMISSION"),
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> dict:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    try:
        tender_uuid = uuid.UUID(tender_id)
        bidder_uuid = uuid.UUID(bidder_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid id.") from exc

    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    bidder = db.get(Bidder, bidder_uuid)
    if not bidder or bidder.tender_id != tender_uuid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bidder not found.")

    name = _safe_filename(file.filename or "bid.pdf")
    object_key = f"bidders/{bidder_id}/{uuid.uuid4()}_{name}"
    content = file.file.read()
    storage_service.upload_file(object_key, content, file.content_type or "application/pdf")

    doc = BidderDocument(
        bidder_id=bidder_uuid,
        kind=kind,
        object_key=object_key,
        original_filename=file.filename,
        status="PENDING",
        created_at=datetime.utcnow(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    dispatch_ocr(str(doc.id))

    _append_audit_entry(
        db,
        agency_id=tender.agency_id,
        tender_id=tender_uuid,
        actor_user_id=user_id,
        action="UPLOAD_BIDDER_DOCUMENT",
        payload={"tenderId": tender_id, "bidderId": bidder_id, "documentId": str(doc.id), "objectKey": object_key},
    )

    return {"documentId": str(doc.id), "objectKey": object_key}


@router.post("/tenders/{tender_id}/evaluate", response_model=EvaluateOut)
def evaluate_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> EvaluateOut:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    tender = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)

    run = EvaluationRun(
        tender_id=tender_uuid,
        status="PENDING",
        created_at=datetime.utcnow(),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    task = dispatch_evaluation(tender_id)

    _append_audit_entry(
        db,
        agency_id=tender.agency_id,
        tender_id=tender_uuid,
        actor_user_id=user_id,
        action="EVALUATE_TENDER",
        payload={"tenderId": tender_id, "evaluationRunId": str(run.id), "taskId": task.id},
    )

    return EvaluateOut(evaluation_run_id=str(run.id), taskId=task.id)


@router.get("/tenders/{tender_id}/documents", response_model=list[TenderDocumentOut])
def list_tender_documents(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[TenderDocumentOut]:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    docs = db.execute(select(TenderDocument).where(TenderDocument.tender_id == tender_uuid)).scalars().all()
    return [
        TenderDocumentOut(
            id=str(d.id),
            tenderId=str(d.tender_id),
            kind=d.kind,
            status=d.status,
            objectKey=d.object_key,
            originalFilename=d.original_filename,
            createdAt=iso(d.created_at)
        ) for d in docs
    ]


@router.get("/tenders/{tender_id}/bidders", response_model=list[BidderOut])
def list_tenders_bidders(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[BidderOut]:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    bidders = db.execute(select(Bidder).where(Bidder.tender_id == tender_uuid)).scalars().all()
    return [
        BidderOut(
            id=str(b.id),
            tenderId=str(b.tender_id),
            name=b.name,
            createdAt=iso(b.created_at)
        ) for b in bidders
    ]


@router.get("/tenders/{tender_id}/bidders/{bidder_id}/documents", response_model=list[BidderDocumentOut])
def list_bidder_documents(
    tender_id: str,
    bidder_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[BidderDocumentOut]:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    bidder_uuid = uuid.UUID(bidder_id)
    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    docs = db.execute(select(BidderDocument).where(BidderDocument.bidder_id == bidder_uuid)).scalars().all()
    return [
        BidderDocumentOut(
            id=str(d.id),
            bidderId=str(d.bidder_id),
            kind=d.kind,
            status=d.status,
            objectKey=d.object_key,
            originalFilename=d.original_filename,
            createdAt=iso(d.created_at)
        ) for d in docs
    ]


@router.get("/tenders/{tender_id}/evaluation-runs", response_model=list[EvaluationRunOut])
def list_evaluation_runs(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[EvaluationRunOut]:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    runs = db.execute(select(EvaluationRun).where(EvaluationRun.tender_id == tender_uuid).order_by(EvaluationRun.created_at.desc())).scalars().all()
    return [
        EvaluationRunOut(
            id=str(r.id),
            tenderId=str(r.tender_id),
            status=r.status,
            createdAt=iso(r.created_at),
            finishedAt=iso(r.finished_at) if r.finished_at else None
        ) for r in runs
    ]


@router.get("/tenders/{tender_id}/evaluation-runs/{run_id}/results", response_model=list[CriterionEvaluationOut])
def get_evaluation_results(
    tender_id: str,
    run_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[CriterionEvaluationOut]:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    run_uuid = uuid.UUID(run_id)
    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    results = db.execute(select(CriterionEvaluation).where(CriterionEvaluation.evaluation_run_id == run_uuid)).scalars().all()
    return [
        CriterionEvaluationOut(
            id=str(r.id),
            evaluationRunId=str(r.evaluation_run_id),
            bidderId=str(r.bidder_id),
            criterionId=str(r.criterion_id),
            verdict=r.verdict,
            confidence=r.confidence,
            reason=r.reason,
            evidenceId=str(r.evidence_id) if r.evidence_id else None,
            createdAt=iso(r.created_at)
        ) for r in results
    ]


@router.put("/tenders/{tender_id}/criteria/{criterion_id}", response_model=CriterionOut)
def update_criterion(
    tender_id: str,
    criterion_id: str,
    body: CriterionOut,  # Reuse same schema for input for now
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> CriterionOut:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    crit_uuid = uuid.UUID(criterion_id)
    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    
    crit = db.get(Criterion, crit_uuid)
    if not crit or crit.tender_id != tender_uuid:
        raise HTTPException(status_code=404, detail="Criterion not found")
    
    crit.text = body.text
    crit.type = body.type
    crit.threshold = body.threshold
    crit.mandatory = body.mandatory
    db.commit()
    db.refresh(crit)
    
    return CriterionOut(
        id=str(crit.id),
        tenderId=str(crit.tender_id),
        text=crit.text,
        type=crit.type,
        threshold=crit.threshold,
        mandatory=crit.mandatory,
        sourcePage=crit.source_page,
        confidence=crit.confidence
    )


@router.delete("/tenders/{tender_id}/criteria/{criterion_id}")
def delete_criterion(
    tender_id: str,
    criterion_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> dict:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    crit_uuid = uuid.UUID(criterion_id)
    _ = _require_tender_access(db, user_id=user_id, tender_id=tender_uuid)
    
    crit = db.get(Criterion, crit_uuid)
    if not crit or crit.tender_id != tender_uuid:
        raise HTTPException(status_code=404, detail="Criterion not found")
    
    db.delete(crit)
    db.commit()
    return {"ok": True}
