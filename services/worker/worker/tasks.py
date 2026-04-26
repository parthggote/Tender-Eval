import uuid
from datetime import datetime

from worker.celery_app import celery
from worker.config import settings

# Lazy DB — engine created on first task execution, not at import time
_SessionLocal = None

def get_session():
    global _SessionLocal
    if _SessionLocal is None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        engine = create_engine(settings.internal_database_url, pool_pre_ping=True)
        _SessionLocal = sessionmaker(bind=engine)
    return _SessionLocal()


@celery.task(name="tendereval.ocr_document")
def ocr_document(document_id: str) -> dict:
    from sqlalchemy import select
    from app.db.models import TenderDocument, BidderDocument, DocumentPage, ProcessingStatus, Bidder
    from worker.services.storage import storage_service
    from worker.services.ocr import perform_ocr

    db = get_session()
    try:
        doc = db.get(TenderDocument, uuid.UUID(document_id))
        kind = "TENDER"
        if not doc:
            doc = db.get(BidderDocument, uuid.UUID(document_id))
            kind = "BIDDER"

        if not doc:
            return {"error": "Document not found"}

        doc.status = ProcessingStatus.RUNNING.value
        db.commit()

        file_bytes = storage_service.download_file(doc.object_key)
        pages = perform_ocr(file_bytes)

        for p in pages:
            db.add(DocumentPage(
                document_id=doc.id,
                document_kind=kind,
                page_number=p["page_number"],
                text=p["text"],
                ocr_confidence=p["confidence"]
            ))

        doc.status = ProcessingStatus.SUCCEEDED.value
        doc.ocr_confidence_avg = sum(p["confidence"] for p in pages) / len(pages) if pages else 0.0
        db.commit()

        if kind == "BIDDER":
            bidder = db.get(Bidder, doc.bidder_id)
            if bidder:
                index_bidder_documents.delay(str(bidder.tender_id), str(doc.bidder_id))
        elif kind == "TENDER":
            # Chain: after OCR succeeds, auto-trigger criteria extraction
            # Small delay to allow any other docs being uploaded to also finish OCR
            extract_criteria.apply_async(
                args=[str(doc.tender_id)],
                countdown=3  # 3s grace period
            )

        return {"ok": True, "pageCount": len(pages)}
    finally:
        db.close()


@celery.task(name="tendereval.index_bidder_documents")
def index_bidder_documents(tender_id: str, bidder_id: str) -> dict:
    from sqlalchemy import select
    from app.db.models import DocumentPage, BidderDocument
    from worker.services.embedder import embedder
    from worker.services.pgvector_store import pgvector_store

    db = get_session()
    try:
        bidder_docs = db.execute(
            select(BidderDocument).where(BidderDocument.bidder_id == uuid.UUID(bidder_id))
        ).scalars().all()
        doc_ids = [d.id for d in bidder_docs]

        pages = db.execute(
            select(DocumentPage).where(DocumentPage.document_id.in_(doc_ids))
        ).scalars().all()

        for p in pages:
            embedding = embedder.embed([p.text])[0]
            pgvector_store.upsert_passages(
                bidder_id=bidder_id,
                document_id=str(p.document_id),
                passages=[{"text": p.text, "embedding": embedding, "page_number": p.page_number}]
            )

        return {"ok": True, "indexedPageCount": len(pages)}
    finally:
        db.close()


@celery.task(name="tendereval.extract_criteria", bind=True, max_retries=3)
def extract_criteria(self, tender_id: str) -> dict:
    from sqlalchemy import select
    from app.db.models import TenderDocument, DocumentPage, Criterion, CriterionExtractionRun, ProcessingStatus
    from worker.services.gemini_client import gemini_client

    db = get_session()
    try:
        run = db.execute(
            select(CriterionExtractionRun).where(
                CriterionExtractionRun.tender_id == uuid.UUID(tender_id),
                CriterionExtractionRun.status == "PENDING"
            )
        ).scalars().first()

        if run:
            run.status = ProcessingStatus.RUNNING.value
            db.commit()

        docs = db.execute(
            select(TenderDocument).where(TenderDocument.tender_id == uuid.UUID(tender_id))
        ).scalars().all()
        doc_ids = [d.id for d in docs]

        pages = db.execute(
            select(DocumentPage).where(DocumentPage.document_id.in_(doc_ids))
        ).scalars().all()

        if not pages:
            # OCR may still be running — retry after 15s (up to 3 times = 45s total wait)
            print(f"[extract_criteria] No text yet for tender {tender_id}, retrying…")
            if run:
                run.status = ProcessingStatus.PENDING.value
                db.commit()
            raise self.retry(countdown=15)

        full_text = "\n".join(p.text for p in pages)
        print(f"[extract_criteria] {len(full_text)} chars, calling Gemini…")

        criteria_data = gemini_client.extract_criteria(full_text)
        print(f"[extract_criteria] Gemini returned {len(criteria_data)} criteria")

        for c in criteria_data:
            db.add(Criterion(
                tender_id=uuid.UUID(tender_id),
                text=c["text"],
                type=c["type"],
                threshold=str(c["threshold"]) if c.get("threshold") else None,
                mandatory=c.get("mandatory", True),
                source_page=c.get("source_page"),
                confidence=0.9,
                created_at=datetime.utcnow()
            ))

        if run:
            run.status = ProcessingStatus.SUCCEEDED.value
            run.finished_at = datetime.utcnow()
            run.model = "gemini-2.5-flash"
        db.commit()

        return {"ok": True, "criteriaCount": len(criteria_data)}
    finally:
        db.close()


@celery.task(name="tendereval.evaluate_tender")
def evaluate_tender(tender_id: str) -> dict:
    from sqlalchemy import select
    from app.db.models import Criterion, Bidder, CriterionEvaluation, EvaluationRun, ProcessingStatus, ReviewCase
    from worker.services.embedder import embedder
    from worker.services.pgvector_store import pgvector_store
    from worker.services.gemini_client import gemini_client

    db = get_session()
    try:
        run = db.execute(
            select(EvaluationRun).where(
                EvaluationRun.tender_id == uuid.UUID(tender_id),
                EvaluationRun.status == "PENDING"
            )
        ).scalars().first()

        if run:
            run.status = ProcessingStatus.RUNNING.value
            db.commit()

        criteria = db.execute(
            select(Criterion).where(Criterion.tender_id == uuid.UUID(tender_id))
        ).scalars().all()
        bidders = db.execute(
            select(Bidder).where(Bidder.tender_id == uuid.UUID(tender_id))
        ).scalars().all()

        count = 0
        for b in bidders:
            for c in criteria:
                query_vector = embedder.embed([c.text])[0]
                results = pgvector_store.search(str(b.id), query_vector, limit=3)
                evidence_text = "\n".join(r["text"] for r in results)

                eval_result = gemini_client.evaluate_criterion(c.text, evidence_text)

                db.add(CriterionEvaluation(
                    evaluation_run_id=run.id if run else uuid.uuid4(),
                    bidder_id=b.id,
                    criterion_id=c.id,
                    verdict=eval_result["verdict"],
                    confidence=eval_result["confidence"],
                    reason=eval_result["reason"],
                    created_at=datetime.utcnow()
                ))

                if eval_result["verdict"] in ("NEEDS_REVIEW", "FAIL"):
                    db.add(ReviewCase(
                        tender_id=uuid.UUID(tender_id),
                        bidder_id=b.id,
                        criterion_id=c.id,
                        status="OPEN",
                        reason=eval_result["reason"],
                        created_at=datetime.utcnow()
                    ))
                count += 1

        if run:
            run.status = ProcessingStatus.SUCCEEDED.value
            run.finished_at = datetime.utcnow()
        db.commit()

        return {"ok": True, "evaluationsCreated": count}
    finally:
        db.close()


@celery.task(name="tendereval.export_report")
def export_report(tender_id: str) -> dict:
    from sqlalchemy import select
    from app.db.models import Tender, Bidder, Criterion, CriterionEvaluation, EvaluationRun, ReportExport, ProcessingStatus
    from worker.services.storage import storage_service
    from worker.services.report_builder import generate_report_pdf

    db = get_session()
    try:
        tender = db.get(Tender, uuid.UUID(tender_id))
        export = db.execute(
            select(ReportExport).where(
                ReportExport.tender_id == uuid.UUID(tender_id),
                ReportExport.status == ProcessingStatus.PENDING.value
            )
        ).scalars().first()

        if export:
            export.status = ProcessingStatus.RUNNING.value
            db.commit()

        latest_run = db.execute(
            select(EvaluationRun).where(
                EvaluationRun.tender_id == uuid.UUID(tender_id),
                EvaluationRun.status == ProcessingStatus.SUCCEEDED.value
            ).order_by(EvaluationRun.created_at.desc())
        ).scalars().first()

        if not latest_run:
            return {"error": "No successful evaluation run found"}

        bidders = db.execute(
            select(Bidder).where(Bidder.tender_id == uuid.UUID(tender_id))
        ).scalars().all()

        report_data = {"tender_title": tender.title, "bidders": []}

        for b in bidders:
            evals = db.execute(
                select(CriterionEvaluation, Criterion).join(Criterion).where(
                    CriterionEvaluation.evaluation_run_id == latest_run.id,
                    CriterionEvaluation.bidder_id == b.id
                )
            ).all()
            report_data["bidders"].append({
                "name": b.name,
                "evaluations": [
                    {"criterion": crit.text, "verdict": ev.verdict, "reason": ev.reason}
                    for ev, crit in evals
                ]
            })

        pdf_bytes = generate_report_pdf(report_data)
        object_key = f"reports/{tender_id}/report_{uuid.uuid4()}.pdf"
        storage_service.upload_file(object_key, pdf_bytes, "application/pdf")

        if export:
            export.status = ProcessingStatus.SUCCEEDED.value
            export.object_key = object_key
            db.commit()

        return {"ok": True, "objectKey": object_key}
    finally:
        db.close()
