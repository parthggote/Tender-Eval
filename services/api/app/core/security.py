from __future__ import annotations

import hmac
import time
from hashlib import sha256

from fastapi import HTTPException, status

from app.core.config import settings


def verify_signed_user_context(
    *,
    user_id: str | None,
    timestamp_ms: str | None,
    signature_hex: str | None,
    max_skew_seconds: int = 300,
) -> str:
    if not user_id or not timestamp_ms or not signature_hex:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing signed user context headers.",
        )

    try:
        ts_ms = int(timestamp_ms)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid timestamp header.",
        ) from exc

    now_ms = int(time.time() * 1000)
    if abs(now_ms - ts_ms) > max_skew_seconds * 1000:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signed user context is too old.",
        )

    expected = hmac.new(
        settings.auth_secret.encode("utf-8"),
        f"{user_id}.{timestamp_ms}".encode("utf-8"),
        sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature_hex):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature.",
        )

    return user_id

