from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from app.core.security import verify_signed_user_context
from app.services.celery_dispatch import celery_app
from app.schemas.dtos import JobStatusOut

router = APIRouter()

@router.get("/jobs/{task_id}", response_model=JobStatusOut)
def get_job_status(
    task_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_timestamp: str | None = Header(default=None, alias="X-User-Timestamp"),
    x_user_signature: str | None = Header(default=None, alias="X-User-Signature"),
) -> JobStatusOut:
    _ = verify_signed_user_context(user_id=x_user_id, timestamp_ms=x_user_timestamp, signature_hex=x_user_signature)
    
    result = celery_app.AsyncResult(task_id)
    return JobStatusOut(
        taskId=task_id,
        status=result.status,
        result=result.result if result.ready() and isinstance(result.result, dict) else None
    )
