from __future__ import annotations

import uuid
from datetime import datetime
from hashlib import sha256
import json

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_signed_user_context
from app.db.models import (
    AuditEntry,
    AgencyMembership,
    ClarificationRequest,
    OfficerRole,
    ReviewAction,
    ReviewCase,
    ReviewDecision,
    Tender,
    Verdict,
)
from app.db.session import get_db
from app.schemas.dtos import ReviewCaseOut, ReviewDecisionIn, iso

router = APIRouter()


def _append_audit_entry(
    db: Session,
    *,
    tender_id: uuid.UUID | None,
    actor_user_id: str | None,
    action: str,
    payload: dict,
) -> None:
    last = db.execute(
        select(AuditEntry).where(AuditEntry.tender_id == tender_id).order_by(AuditEntry.created_at.desc())
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
            agency_id=None,
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


def _require_tender_membership(
    db: Session, 
    *, 
    user_id: str, 
    tender_id: uuid.UUID, 
    allowed_roles: list[str] | None = None
) -> Tender:
    tender = db.get(Tender, tender_id)
    if not tender:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tender not found.")

    membership = db.execute(
        select(AgencyMembership).where(
            AgencyMembership.user_id == user_id, AgencyMembership.agency_id == tender.agency_id
        )
    ).scalars().first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this agency.")

    if allowed_roles and membership.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    return tender


@router.get("/tenders/{tender_id}/review-cases", response_model=list[ReviewCaseOut])
def list_review_cases(
    tender_id: str,
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

    try:
        tender_uuid = uuid.UUID(tender_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tender id.") from exc

    _ = _require_tender_membership(db, user_id=user_id, tender_id=tender_uuid)

    cases = db.execute(
        select(ReviewCase).where(ReviewCase.tender_id == tender_uuid).order_by(ReviewCase.created_at.asc())
    ).scalars().all()

    return [
        ReviewCaseOut(
            id=str(c.id),
            tenderId=str(c.tender_id),
            bidderId=str(c.bidder_id),
            criterionId=str(c.criterion_id),
            status=c.status,
            reason=c.reason,
            dueAt=None,
            createdAt=iso(c.created_at),
        )
        for c in cases
    ]


@router.post("/review-cases/{review_case_id}/decision")
def decide_review_case(
    review_case_id: str,
    body: ReviewDecisionIn,
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
        case_uuid = uuid.UUID(review_case_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid review case id.") from exc

    case = db.get(ReviewCase, case_uuid)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review case not found.")

    _ = _require_tender_membership(
        db, 
        user_id=user_id, 
        tender_id=case.tender_id,
        allowed_roles=[OfficerRole.REVIEW_OFFICER.value, OfficerRole.SYSTEM_ADMIN.value]
    )

    try:
        action = ReviewAction(body.action)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action.") from exc

    final_verdict: Verdict | None = None
    if body.finalVerdict is not None:
        try:
            final_verdict = Verdict(body.finalVerdict)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verdict.") from exc

    if action == ReviewAction.OVERRIDDEN and not body.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Override requires a reason.",
        )

    if action == ReviewAction.OVERRIDDEN and not final_verdict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Override requires a finalVerdict.",
        )

    if action == ReviewAction.REQUESTED_CLARIFICATION and not body.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clarification requires a reason/message.",
        )

    decision = ReviewDecision(
        review_case_id=case.id,
        actor_user_id=user_id,
        action=action.value,
        final_verdict=final_verdict.value if final_verdict else None,
        reason=body.reason,
        created_at=datetime.utcnow(),
    )
    db.add(decision)

    # Preserve disagreements; don't overwrite. Update status to reflect officer action.
    if action in (ReviewAction.ACCEPTED, ReviewAction.OVERRIDDEN):
        case.status = "CLOSED"
    elif action == ReviewAction.ESCALATED:
        case.status = "ESCALATED"
    elif action == ReviewAction.REQUESTED_CLARIFICATION:
        case.status = "CLARIFICATION_REQUESTED"
        db.add(
            ClarificationRequest(
                tender_id=case.tender_id,
                bidder_id=case.bidder_id,
                criterion_id=case.criterion_id,
                status="DRAFT",
                letter_text=body.reason or "",
                created_at=datetime.utcnow(),
            )
        )
    db.add(case)
    db.commit()

    _append_audit_entry(
        db,
        tender_id=case.tender_id,
        actor_user_id=user_id,
        action="REVIEW_DECISION",
        payload={
            "reviewCaseId": str(case.id),
            "action": action.value,
            "finalVerdict": final_verdict.value if final_verdict else None,
            "reason": body.reason,
        },
    )

    return {"ok": True}
