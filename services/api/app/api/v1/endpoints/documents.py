from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import verify_signed_user_context
from app.db.session import get_db, SessionLocal
from app.services.storage import storage_service
from app.schemas.dtos import SignedUrlOut

router = APIRouter()


@router.get("/documents/{object_key:path}/signed-url", response_model=SignedUrlOut)
def get_document_signed_url(
    object_key: str,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> SignedUrlOut:
    _ = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)

    url = storage_service.get_signed_url(object_key)
    expires_at = datetime.utcnow().timestamp() + 1800

    return SignedUrlOut(url=url, expiresAt=datetime.fromtimestamp(expires_at).isoformat() + "Z")


def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event message."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.get("/tenders/{tender_id}/documents/{document_id}/status-stream")
async def stream_document_status(
    tender_id: str,
    document_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> StreamingResponse:
    """
    SSE stream that emits document processing status events.
    Events: step_update, done, error
    """
    _ = verify_signed_user_context(
        user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature
    )

    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document id.")

    async def event_generator():
        from app.db.models import TenderDocument, DocumentPage

        last_status: str | None = None
        last_page_count: int = 0
        ticks = 0
        max_ticks = 120  # 2 min timeout at 1s intervals

        yield _sse_event("step_update", {
            "step": "processing",
            "message": "Document received, queuing OCR…",
            "progress": 5,
        })

        while ticks < max_ticks:
            await asyncio.sleep(1)
            ticks += 1

            db = SessionLocal()
            try:
                doc = db.get(TenderDocument, doc_uuid)
                if not doc:
                    yield _sse_event("error", {"message": "Document not found."})
                    return

                current_status = doc.status.upper() if doc.status else "PENDING"

                # Emit status transitions
                if current_status != last_status:
                    last_status = current_status

                    if current_status == "RUNNING":
                        yield _sse_event("step_update", {
                            "step": "processing",
                            "message": "OCR engine started, reading pages…",
                            "progress": 20,
                        })
                    elif current_status in ("SUCCEEDED", "READY"):
                        # Count pages extracted
                        page_count = db.query(DocumentPage).filter(
                            DocumentPage.document_id == doc_uuid
                        ).count()
                        yield _sse_event("step_update", {
                            "step": "processing",
                            "message": f"OCR complete — {page_count} page(s) extracted.",
                            "progress": 100,
                            "pageCount": page_count,
                        })
                        yield _sse_event("done", {
                            "documentId": document_id,
                            "pageCount": page_count,
                            "ocrConfidence": doc.ocr_confidence_avg,
                        })
                        return
                    elif current_status == "FAILED":
                        yield _sse_event("error", {"message": "OCR processing failed."})
                        return

                # Emit incremental page progress while RUNNING
                elif current_status == "RUNNING":
                    page_count = db.query(DocumentPage).filter(
                        DocumentPage.document_id == doc_uuid
                    ).count()
                    if page_count > last_page_count:
                        last_page_count = page_count
                        progress = min(20 + page_count * 5, 90)
                        yield _sse_event("step_update", {
                            "step": "processing",
                            "message": f"Processing page {page_count}…",
                            "progress": progress,
                        })

                # Heartbeat every 10s to keep connection alive
                elif ticks % 10 == 0:
                    yield _sse_event("heartbeat", {"tick": ticks})

            finally:
                db.close()

        yield _sse_event("error", {"message": "Processing timed out. Please try again."})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
