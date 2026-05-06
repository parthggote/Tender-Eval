from __future__ import annotations

import uuid
from datetime import datetime
from hashlib import sha256
import json

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_signed_user_context
from app.db.models import AgencyMembership, AgencyWorkspace, AuditEntry, OfficerRole, ReviewCase, Tender, ReportExport
from app.db.session import get_db
from app.schemas.dtos import AgencyWorkspaceOut, ReviewCaseOut, AuditEntryOut, iso, ReportExportOut
from app.services.storage import storage_service
from app.services.storage import storage_service

router = APIRouter()


def _append_audit_entry(
    db: Session,
    *,
    agency_id: uuid.UUID | None,
    tender_id: uuid.UUID | None,
    actor_user_id: str | None,
    action: str,
    payload: dict,
) -> AuditEntry:
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
    entry = AuditEntry(
        agency_id=agency_id,
        tender_id=tender_id,
        actor_user_id=actor_user_id,
        action=action,
        payload=payload,
        prev_hash=prev_hash,
        hash=entry_hash,
        created_at=created_at,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def _bootstrap_if_needed(db: Session, user_id: str) -> None:
    any_agency = db.execute(select(AgencyWorkspace).limit(1)).scalars().first()
    if any_agency:
        return

    agency = AgencyWorkspace(slug="crpf", name="CRPF")
    db.add(agency)
    db.commit()
    db.refresh(agency)

    db.add(
        AgencyMembership(
            agency_id=agency.id,
            user_id=user_id,
            role=OfficerRole.SYSTEM_ADMIN.value,
            created_at=datetime.utcnow(),
        )
    )
    db.commit()

    _append_audit_entry(
        db,
        agency_id=agency.id,
        tender_id=None,
        actor_user_id=user_id,
        action="BOOTSTRAP_AGENCY",
        payload={"agencySlug": agency.slug},
    )


@router.get("/agencies", response_model=list[AgencyWorkspaceOut])
def list_agencies(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[AgencyWorkspaceOut]:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )

    agencies = db.execute(
        select(AgencyWorkspace)
        .join(AgencyMembership, AgencyMembership.agency_id == AgencyWorkspace.id)
        .where(AgencyMembership.user_id == user_id)
        .order_by(AgencyWorkspace.name.asc())
    ).scalars().all()

    return [AgencyWorkspaceOut(id=str(a.id), slug=a.slug, name=a.name, logoUrl=a.logo_url) for a in agencies]


@router.patch("/agencies/{agency_slug}", response_model=AgencyWorkspaceOut)
async def update_agency(
    agency_slug: str,
    name: str | None = Form(None),
    logo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> AgencyWorkspaceOut:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)

    agency = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == agency_slug)).scalars().first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Check admin membership
    membership = db.execute(select(AgencyMembership).where(
        AgencyMembership.agency_id == agency.id,
        AgencyMembership.user_id == user_id,
        AgencyMembership.role == OfficerRole.SYSTEM_ADMIN.value
    )).scalars().first()
    if not membership:
        raise HTTPException(status_code=403, detail="Only admins can update agency settings")

    if name:
        agency.name = name

    if logo and logo.filename:
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]
        content_type = (logo.content_type or "").lower()
        if content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Logo must be an image (JPEG, PNG, WebP, or SVG)")
        ext = logo.filename.split(".")[-1] if "." in logo.filename else "png"
        object_key = f"agencies/{agency_slug}/logo.{ext}"
        content = await logo.read()
        # Skip if the browser sent an empty file part
        if not content:
            pass
        else:
            agency.logo_url = storage_service.upload_file(object_key, content, content_type or "image/png")

    agency.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agency)

    _append_audit_entry(
        db, agency_id=agency.id, tender_id=None, actor_user_id=user_id,
        action="UPDATE_AGENCY", payload={"agencySlug": agency.slug, "updatedName": name, "updatedLogo": logo is not None and logo.filename is not None},
    )

    return AgencyWorkspaceOut(id=str(agency.id), name=agency.name, slug=agency.slug, logoUrl=agency.logo_url)


@router.post("/agencies", response_model=AgencyWorkspaceOut)
async def create_agency(
    name: str = Form(...),
    slug: str = Form(...),
    logo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> AgencyWorkspaceOut:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    
    if not name or not slug:
        raise HTTPException(status_code=400, detail="Name and slug are required")
    
    # Check if slug already exists
    existing = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == slug)).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Agency with this slug already exists")
    
    # Upload logo if provided
    logo_url = None
    if logo and logo.filename:
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]
        content_type = (logo.content_type or "").lower()
        if content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Logo must be an image (JPEG, PNG, WebP, or SVG)")
        
        # Generate unique filename
        ext = logo.filename.split(".")[-1] if "." in logo.filename else "png"
        object_key = f"agencies/{slug}/logo.{ext}"
        
        # Upload to Supabase Storage
        content = await logo.read()
        if content:
            logo_url = storage_service.upload_file(object_key, content, content_type or "image/png")
    
    agency = AgencyWorkspace(name=name, slug=slug, logo_url=logo_url)
    db.add(agency)
    db.commit()
    db.refresh(agency)
    
    membership = AgencyMembership(agency_id=agency.id, user_id=user_id, role=OfficerRole.SYSTEM_ADMIN.value)
    db.add(membership)
    db.commit()
    
    _append_audit_entry(
        db,
        agency_id=agency.id,
        tender_id=None,
        actor_user_id=user_id,
        action="CREATE_AGENCY",
        payload={"agencySlug": agency.slug, "agencyName": agency.name, "hasLogo": logo_url is not None},
    )
    
    return AgencyWorkspaceOut(id=str(agency.id), name=agency.name, slug=agency.slug, logoUrl=logo_url)


@router.post("/agencies/{agency_id_or_slug}/members")
def add_agency_member(
    agency_id_or_slug: str,
    target_user_id: str,
    role: str = OfficerRole.PROCUREMENT_OFFICER.value,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> dict:
    user_id = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    
    agency: AgencyWorkspace | None = None
    try:
        agency_uuid = uuid.UUID(agency_id_or_slug)
        agency = db.get(AgencyWorkspace, agency_uuid)
    except ValueError:
        agency = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == agency_id_or_slug)).scalars().first()
    
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
        
    # Check if current user is admin
    admin_check = db.execute(select(AgencyMembership).where(
        AgencyMembership.agency_id == agency.id,
        AgencyMembership.user_id == user_id,
        AgencyMembership.role == OfficerRole.SYSTEM_ADMIN.value
    )).scalars().first()
    
    if not admin_check:
        raise HTTPException(status_code=403, detail="Only admins can add members")
        
    new_member = AgencyMembership(agency_id=agency.id, user_id=target_user_id, role=role)
    db.add(new_member)
    db.commit()
    
    return {"ok": True}


@router.get("/agencies/{agency_slug}/review-queue", response_model=list[ReviewCaseOut])
def get_agency_review_queue(
    agency_slug: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[ReviewCaseOut]:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    agency = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == agency_slug)).scalars().first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Check membership
    membership = db.execute(select(AgencyMembership).where(
        AgencyMembership.agency_id == agency.id,
        AgencyMembership.user_id == user_id
    )).scalars().first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this agency")

    # Get all review cases for all tenders in this agency
    cases = db.execute(
        select(ReviewCase)
        .join(Tender, Tender.id == ReviewCase.tender_id)
        .where(Tender.agency_id == agency.id)
        .order_by(ReviewCase.created_at.desc())
    ).scalars().all()

    return [
        ReviewCaseOut(
            id=str(c.id),
            tenderId=str(c.tender_id),
            bidderId=str(c.bidder_id),
            criterionId=str(c.criterion_id),
            status=c.status,
            reason=c.reason,
            createdAt=iso(c.created_at)
        ) for c in cases
    ]


@router.get("/agencies/{agency_slug}/audit-log", response_model=list[AuditEntryOut])
def get_agency_audit_log(
    agency_slug: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[AuditEntryOut]:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    agency = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == agency_slug)).scalars().first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Check membership
    membership = db.execute(select(AgencyMembership).where(
        AgencyMembership.agency_id == agency.id,
        AgencyMembership.user_id == user_id
    )).scalars().first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this agency")

    logs = db.execute(
        select(AuditEntry)
        .where(AuditEntry.agency_id == agency.id)
        .order_by(AuditEntry.created_at.desc())
        .limit(100)
    ).scalars().all()

    return [
        AuditEntryOut(
            id=str(log.id),
            agencyId=str(log.agency_id),
            tenderId=str(log.tender_id) if log.tender_id else None,
            actorUserId=log.actor_user_id,
            action=log.action,
            payload=log.payload,
            prevHash=log.prev_hash,
            hash=log.hash,
            createdAt=iso(log.created_at)
        ) for log in logs
    ]


@router.get("/agencies/{agency_slug}/reports", response_model=list[ReportExportOut])
def get_agency_reports(
    agency_slug: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> list[ReportExportOut]:
    user_id = verify_signed_user_context(
        user_id=x_user_id,
        timestamp_ms=x_user_timestamp,
        signature_hex=x_user_signature,
    )
    agency = db.execute(select(AgencyWorkspace).where(AgencyWorkspace.slug == agency_slug)).scalars().first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Check membership
    membership = db.execute(select(AgencyMembership).where(
        AgencyMembership.agency_id == agency.id,
        AgencyMembership.user_id == user_id
    )).scalars().first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this agency")

    reports = db.execute(
        select(ReportExport)
        .join(Tender, Tender.id == ReportExport.tender_id)
        .where(Tender.agency_id == agency.id)
        .order_by(ReportExport.created_at.desc())
    ).scalars().all()

    return [
        ReportExportOut(
            id=str(r.id),
            tenderId=str(r.tender_id),
            status=r.status,
            createdAt=iso(r.created_at),
            objectKey=r.object_key
        ) for r in reports
    ]
