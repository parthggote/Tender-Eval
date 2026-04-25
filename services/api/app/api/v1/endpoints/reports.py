from __future__ import annotations

from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_signed_user_context
from app.db.models import AgencyMembership, ReportExport, Tender, ProcessingStatus
from app.db.session import get_db
from app.schemas.dtos import ReportExportOut, iso
from app.services.celery_dispatch import dispatch_report_export

router = APIRouter()


@router.get("/tenders/{tender_id}/reports/latest", response_model=ReportExportOut)
def latest_report(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> ReportExportOut:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )

    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    tender = db.get(Tender, tender_uuid)
    if not tender:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tender not found.")

    membership = db.execute(
        select(AgencyMembership).where(
            AgencyMembership.user_id == user_id, AgencyMembership.agency_id == tender.agency_id
        )
    ).scalars().first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this agency.")

    export = db.execute(
        select(ReportExport)
        .where(ReportExport.tender_id == tender_uuid)
        .order_by(ReportExport.created_at.desc())
        .limit(1)
    ).scalars().first()

    if not export:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No export found.")

    return ReportExportOut(
        id=str(export.id),
        tenderId=str(export.tender_id),
        status=export.status,
        createdAt=iso(export.created_at),
        objectKey=export.object_key,
    )


@router.post("/tenders/{tender_id}/reports/export", response_model=ReportExportOut)
def trigger_report_export(
    tender_id: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> ReportExportOut:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    tender_uuid = uuid.UUID(tender_id)
    
    # Check access
    tender = db.get(Tender, tender_uuid)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    membership = db.execute(select(AgencyMembership).where(
        AgencyMembership.user_id == user_id, AgencyMembership.agency_id == tender.agency_id
    )).scalars().first()
    if not membership:
        raise HTTPException(status_code=403, detail="Forbidden")

    export = ReportExport(
        tender_id=tender_uuid,
        status=ProcessingStatus.PENDING.value,
        created_at=datetime.utcnow()
    )
    db.add(export)
    db.commit()
    db.refresh(export)
    
    task = dispatch_report_export(tender_id)
    
    return ReportExportOut(
        id=str(export.id),
        tenderId=str(export.tender_id),
        status=export.status,
        createdAt=iso(export.created_at)
    )
