from __future__ import annotations

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "tendereval",
    broker=settings.redis_url,
    backend=settings.redis_url
)

def dispatch_ocr(document_id: str):
    return celery_app.send_task("tendereval.ocr_document", args=[document_id])

def dispatch_criteria_extraction(tender_id: str):
    return celery_app.send_task("tendereval.extract_criteria", args=[tender_id])

def dispatch_evaluation(tender_id: str):
    return celery_app.send_task("tendereval.evaluate_tender", args=[tender_id])

def dispatch_report_export(tender_id: str):
    return celery_app.send_task("tendereval.export_report", args=[tender_id])
