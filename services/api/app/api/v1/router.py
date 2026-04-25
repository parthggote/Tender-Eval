from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import agencies, documents, health, jobs, reports, review, tenders

router = APIRouter(prefix="/api/v1")

router.include_router(health.router, tags=["Health"])
router.include_router(agencies.router, tags=["Agencies"])
router.include_router(tenders.router, tags=["Tenders"])
router.include_router(review.router, tags=["Review"])
router.include_router(reports.router, tags=["Reports"])
router.include_router(jobs.router, tags=["Jobs"])
router.include_router(documents.router, tags=["Documents"])

