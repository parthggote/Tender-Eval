import uuid
from datetime import datetime
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker

from worker.celery_app import celery
from worker.config import settings
from worker.services.storage import storage_service
from worker.services.ocr import perform_ocr
from worker.services.embedder import embedder
from worker.services.pgvector_store import pgvector_store as qdrant_store
from worker.services.gemini_client import gemini_client
from worker.services.report_builder import generate_report_pdf

# DB Setup for worker
engine = create_engine(settings.internal_database_url)
SessionLocal = sessionmaker(bind=engine)

@celery.task(name="tendereval.ocr_document")
def ocr_document(document_id: str) -> dict:
    from app.db.models import TenderDocument, BidderDocument, DocumentPage, ProcessingStatus
    
    db = SessionLocal()
    try:
        # Check both tables
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

        # Save pages to DB
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

        # If it's a bidder document, trigger indexing
        if kind == "BIDDER":
            # We need tender_id from bidder
            from app.db.models import Bidder
            bidder = db.get(Bidder, doc.bidder_id)
            index_bidder_documents.delay(str(bidder.tender_id), str(doc.bidder_id))

        return {"ok": True, "pageCount": len(pages)}
    finally:
        db.close()


@celery.task(name="tendereval.index_bidder_documents")
def index_bidder_documents(tender_id: str, bidder_id: str) -> dict:
    from app.db.models import DocumentPage, BidderDocument
    
    db = SessionLocal()
    try:
        # Get all documents for this bidder
        bidder_docs = db.execute(select(BidderDocument).where(BidderDocument.bidder_id == uuid.UUID(bidder_id))).scalars().all()
        doc_ids = [d.id for d in bidder_docs]
        
        # Get all pages
        pages = db.execute(select(DocumentPage).where(DocumentPage.document_id.in_(doc_ids))).scalars().all()
        
        for p in pages:
            # Chunking (very simple for now: per page)
            # In production, use semantic chunking
            embedding = embedder.embed([p.text])[0]
            qdrant_store.upsert_passages(
                bidder_id=bidder_id,
                document_id=str(p.document_id),
                passages=[{
                    "text": p.text,
                    "embedding": embedding,
                    "page_number": p.page_number
                }]
            )
        
        return {"ok": True, "indexedPageCount": len(pages)}
    finally:
        db.close()


@celery.task(name="tendereval.extract_criteria")
def extract_criteria(tender_id: str) -> dict:
    from app.db.models import TenderDocument, DocumentPage, Criterion, CriterionExtractionRun, ProcessingStatus
    
    db = SessionLocal()
    try:
        run = db.execute(select(CriterionExtractionRun).where(
            CriterionExtractionRun.tender_id == uuid.UUID(tender_id),
            CriterionExtractionRun.status == "PENDING"
        )).scalars().first()
        
        if run:
            run.status = ProcessingStatus.RUNNING.value
            db.commit()

        # Get tender docs
        docs = db.execute(select(TenderDocument).where(TenderDocument.tender_id == uuid.UUID(tender_id))).scalars().all()
        doc_ids = [d.id for d in docs]
        
        # Get all text
        pages = db.execute(select(DocumentPage).where(DocumentPage.document_id.in_(doc_ids))).scalars().all()
        if not pages:
            print(f"No text found for tender {tender_id}. OCR might still be running or failed.")
            if run:
                run.status = ProcessingStatus.FAILED.value
                run.finished_at = datetime.utcnow()
            db.commit()
            return {"error": "No text found for extraction"}

        full_text = "\n".join([p.text for p in pages])
        print(f"Extracted {len(full_text)} characters for tender {tender_id}. Calling Gemini...")
        
        criteria_data = gemini_client.extract_criteria(full_text)
        print(f"Gemini returned {len(criteria_data)} criteria.")
        
        for c in criteria_data:
            db.add(Criterion(
                tender_id=uuid.UUID(tender_id),
                text=c["text"],
                type=c["type"],
                threshold=str(c.get("threshold")) if c.get("threshold") else None,
                mandatory=c.get("mandatory", True),
                source_page=c.get("source_page"),
                confidence=0.9, # Placeholder confidence
                created_at=datetime.utcnow()
            ))
            
        if run:
            run.status = ProcessingStatus.SUCCEEDED.value
            run.finished_at = datetime.utcnow()
            run.model = "gemini-flash-latest"
        db.commit()
        
        return {"ok": True, "criteriaCount": len(criteria_data)}
    finally:
        db.close()


@celery.task(name="tendereval.evaluate_tender")
def evaluate_tender(tender_id: str) -> dict:
    from app.db.models import Criterion, Bidder, CriterionEvaluation, EvaluationRun, ProcessingStatus, ReviewCase
    
    db = SessionLocal()
    try:
        run = db.execute(select(EvaluationRun).where(
            EvaluationRun.tender_id == uuid.UUID(tender_id),
            EvaluationRun.status == "PENDING"
        )).scalars().first()
        
        if run:
            run.status = ProcessingStatus.RUNNING.value
            db.commit()

        criteria = db.execute(select(Criterion).where(Criterion.tender_id == uuid.UUID(tender_id))).scalars().all()
        bidders = db.execute(select(Bidder).where(Bidder.tender_id == uuid.UUID(tender_id))).scalars().all()
        
        count = 0
        for b in bidders:
            for c in criteria:
                # 1. Search for evidence
                query_vector = embedder.embed([c.text])[0]
                results = qdrant_store.search(str(b.id), query_vector, limit=3)
                evidence_text = "\n".join([r.payload["text"] for r in results])
                
                # 2. Evaluate with Gemini
                eval_result = gemini_client.evaluate_criterion(c.text, evidence_text)
                
                evaluation = CriterionEvaluation(
                    evaluation_run_id=run.id if run else uuid.uuid4(),
                    bidder_id=b.id,
                    criterion_id=c.id,
                    verdict=eval_result["verdict"],
                    confidence=eval_result["confidence"],
                    reason=eval_result["reason"],
                    created_at=datetime.utcnow()
                )
                db.add(evaluation)
                
                if eval_result["verdict"] == "NEEDS_REVIEW" or eval_result["verdict"] == "FAIL":
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
    from app.db.models import Tender, Bidder, Criterion, CriterionEvaluation, EvaluationRun, ReportExport, ProcessingStatus
    
    db = SessionLocal()
    try:
        tender = db.get(Tender, uuid.UUID(tender_id))
        export = db.execute(select(ReportExport).where(
            ReportExport.tender_id == uuid.UUID(tender_id),
            ReportExport.status == ProcessingStatus.PENDING.value
        )).scalars().first()
        
        if export:
            export.status = ProcessingStatus.RUNNING.value
            db.commit()

        # Get latest run results
        latest_run = db.execute(select(EvaluationRun).where(
            EvaluationRun.tender_id == uuid.UUID(tender_id),
            EvaluationRun.status == ProcessingStatus.SUCCEEDED.value
        ).order_by(EvaluationRun.created_at.desc())).scalars().first()
        
        if not latest_run:
            return {"error": "No successful evaluation run found"}

        bidders = db.execute(select(Bidder).where(Bidder.tender_id == uuid.UUID(tender_id))).scalars().all()
        
        report_data = {
            "tender_title": tender.title,
            "bidders": []
        }
        
        for b in bidders:
            evals = db.execute(select(CriterionEvaluation, Criterion).join(Criterion).where(
                CriterionEvaluation.evaluation_run_id == latest_run.id,
                CriterionEvaluation.bidder_id == b.id
            )).all()
            
            bidder_evals = []
            for ev, crit in evals:
                bidder_evals.append({
                    "criterion": crit.text,
                    "verdict": ev.verdict,
                    "reason": ev.reason,
                    "page": "-" # Add page tracking if available
                })
            
            report_data["bidders"].append({
                "name": b.name,
                "evaluations": bidder_evals
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

