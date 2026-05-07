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
            # PostgreSQL text fields reject NUL bytes — strip them from OCR output
            clean_text = p["text"].replace("\x00", "")
            db.add(DocumentPage(
                document_id=doc.id,
                document_kind=kind,
                page_number=p["page_number"],
                text=clean_text,
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

        if not pages:
            return {"ok": True, "indexedPageCount": 0}

        # Batch embedding to avoid hammering the API (one request per 20 pages).
        texts = [p.text for p in pages]
        embeddings = embedder.embed(texts)

        by_doc: dict[str, list[dict]] = {}
        for p, emb in zip(pages, embeddings, strict=False):
            doc_id = str(p.document_id)
            by_doc.setdefault(doc_id, []).append(
                {"text": p.text, "embedding": emb, "page_number": p.page_number}
            )

        for doc_id, passages in by_doc.items():
            pgvector_store.upsert_passages(
                bidder_id=bidder_id,
                document_id=doc_id,
                passages=passages,
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
        tender_uuid = uuid.UUID(tender_id)

        run = db.execute(
            select(CriterionExtractionRun).where(
                CriterionExtractionRun.tender_id == tender_uuid,
                CriterionExtractionRun.status.in_(
                    [ProcessingStatus.PENDING.value, ProcessingStatus.RUNNING.value]
                ),
            )
            .order_by(CriterionExtractionRun.created_at.desc())
        ).scalars().first()

        # For auto-triggered extraction (e.g. after OCR), the API might not have
        # created a CriterionExtractionRun yet. Create one so the portal can
        # show status and failures.
        if not run:
            run = CriterionExtractionRun(
                tender_id=tender_uuid,
                status=ProcessingStatus.RUNNING.value,
                created_at=datetime.utcnow(),
            )
            db.add(run)
            db.commit()
            db.refresh(run)
        else:
            run.status = ProcessingStatus.RUNNING.value
            db.commit()

        docs = db.execute(
            select(TenderDocument).where(TenderDocument.tender_id == tender_uuid)
        ).scalars().all()
        doc_ids = [d.id for d in docs]

        pages = db.execute(
            select(DocumentPage).where(DocumentPage.document_id.in_(doc_ids))
        ).scalars().all()

        if not pages:
            # OCR may still be running — retry after 15s (up to 3 times = 45s total wait)
            print(f"[extract_criteria] No text yet for tender {tender_id}, retrying…")
            run.status = ProcessingStatus.PENDING.value
            db.commit()
            raise self.retry(countdown=15)

        full_text = "\n".join(p.text for p in pages)
        print(f"[extract_criteria] {len(full_text)} chars, calling Gemini…")

        try:
            criteria_data = gemini_client.extract_criteria(full_text)
        except RuntimeError as exc:
            msg = str(exc)

            # Hard failure: quota bucket is 0 ("limit: 0") — retrying will not help.
            # This typically means the project has no active quota for this model/tier.
            if "limit: 0" in msg or "API quota exhausted" in msg:
                print(f"[extract_criteria] Gemini quota exhausted: {exc}")
                run.status = ProcessingStatus.FAILED.value
                run.finished_at = datetime.utcnow()
                run.model = settings.gemini_text_model
                db.commit()
                raise RuntimeError("LLM_QUOTA_EXHAUSTED") from exc

            # Transient failure: backoff + retry.
            print(f"[extract_criteria] Gemini call failed: {exc}, will retry task")
            run.status = ProcessingStatus.PENDING.value
            db.commit()
            raise self.retry(countdown=30, exc=exc)

        print(f"[extract_criteria] Gemini returned {len(criteria_data)} criteria")

        if not criteria_data:
            # Defensive: treat empty extraction as failure (creates no criteria => cannot evaluate).
            run.status = ProcessingStatus.FAILED.value
            run.finished_at = datetime.utcnow()
            run.model = settings.gemini_text_model
            db.commit()
            raise RuntimeError("NO_CRITERIA_EXTRACTED")

        # Cap at 20 most important criteria — prioritise mandatory ones first,
        # then by order returned (Gemini already ranks by relevance).
        MAX_CRITERIA = 20
        if len(criteria_data) > MAX_CRITERIA:
            mandatory = [c for c in criteria_data if c.get("mandatory", True)]
            optional  = [c for c in criteria_data if not c.get("mandatory", True)]
            criteria_data = (mandatory + optional)[:MAX_CRITERIA]
            print(f"[extract_criteria] Capped to {MAX_CRITERIA} criteria ({len(mandatory)} mandatory)")

        for c in criteria_data:
            db.add(Criterion(
                tender_id=tender_uuid,
                text=c["text"],
                type=c["type"],
                threshold=str(c["threshold"]) if c.get("threshold") else None,
                mandatory=c.get("mandatory", True),
                source_page=c.get("source_page"),
                confidence=0.9,
                created_at=datetime.utcnow()
            ))

        run.status = ProcessingStatus.SUCCEEDED.value
        run.finished_at = datetime.utcnow()
        run.model = settings.gemini_text_model
        db.commit()

        return {"ok": True, "criteriaCount": len(criteria_data)}
    finally:
        db.close()


@celery.task(name="tendereval.evaluate_tender", bind=True, max_retries=3)
def evaluate_tender(self, tender_id: str) -> dict:
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

        # Fail fast — no run means nothing to attach evaluations to
        if not run:
            raise RuntimeError(
                f"[evaluate_tender] No PENDING EvaluationRun found for tender {tender_id}. "
                "Trigger evaluation via the API to create one first."
            )

        criteria = db.execute(
            select(Criterion).where(Criterion.tender_id == uuid.UUID(tender_id))
        ).scalars().all()
        bidders = db.execute(
            select(Bidder).where(Bidder.tender_id == uuid.UUID(tender_id))
        ).scalars().all()

        if not criteria or not bidders:
            run.status = ProcessingStatus.SUCCEEDED.value
            run.finished_at = datetime.utcnow()
            db.commit()
            return {"ok": True, "evaluationsCreated": 0}

        # ── Optimisation 1: batch-embed ALL criteria in a single API call ──
        print(f"[evaluate_tender] Embedding {len(criteria)} criteria in one batch…")
        criteria_texts = [c.text for c in criteria]
        criteria_vectors = embedder.embed(criteria_texts)  # single batched call
        criterion_vector_map = {
            str(c.id): criteria_vectors[i] for i, c in enumerate(criteria)
        }

        count = 0
        for b in bidders:
            # ── Optimisation 2: retrieve evidence for ALL criteria at once ──
            evidence_map: dict[str, str] = {}
            for c in criteria:
                results = pgvector_store.search(
                    str(b.id), criterion_vector_map[str(c.id)], limit=3
                )
                # Limit evidence text to reduce token usage (each passage max ~500 chars)
                evidence_parts = []
                for r in results:
                    text = r["text"]
                    # Truncate individual passages to ~500 chars
                    if len(text) > 500:
                        text = text[:500] + "..."
                    evidence_parts.append(text)
                evidence_map[str(c.id)] = "\n".join(evidence_parts) or "No evidence found."

            # ── Optimisation 3: evaluate ALL criteria in ONE Gemini call per bidder ──
            print(f"[evaluate_tender] Evaluating {len(criteria)} criteria for bidder {b.id} in one call…")
            try:
                eval_results = gemini_client.evaluate_criteria_batch(criteria, evidence_map)
            except RuntimeError as exc:
                msg = str(exc)

                # Hard failure: quota bucket is 0. Don't hammer retries; fall back to
                # NEEDS_REVIEW for all criteria so reviewers can proceed manually.
                if "limit: 0" in msg or "API quota exhausted" in msg:
                    print(f"[evaluate_tender] Gemini quota exhausted: {exc}. Falling back to NEEDS_REVIEW.")
                    eval_results = {
                        str(c.id): {
                            "verdict": "NEEDS_REVIEW",
                            "reason": "LLM quota exhausted/unavailable; manual review required.",
                            "confidence": 0.0,
                        }
                        for c in criteria
                    }
                else:
                    print(f"[evaluate_tender] Gemini batch call failed: {exc}, will retry task")
                    run.status = ProcessingStatus.PENDING.value
                    db.commit()
                    raise self.retry(countdown=30, exc=exc)

            for c in criteria:
                result = eval_results.get(str(c.id), {
                    "verdict": "NEEDS_REVIEW",
                    "reason": "Batch evaluation did not return a result for this criterion.",
                    "confidence": 0.0,
                })

                # ── Duplicate guard: skip if already evaluated in this run ──
                existing_eval = db.execute(
                    select(CriterionEvaluation).where(
                        CriterionEvaluation.evaluation_run_id == run.id,
                        CriterionEvaluation.bidder_id == b.id,
                        CriterionEvaluation.criterion_id == c.id,
                    )
                ).scalars().first()

                if existing_eval:
                    count += 1
                    continue

                db.add(CriterionEvaluation(
                    evaluation_run_id=run.id,
                    bidder_id=b.id,
                    criterion_id=c.id,
                    verdict=result["verdict"],
                    confidence=result["confidence"],
                    reason=result["reason"],
                    created_at=datetime.utcnow()
                ))

                if result["verdict"] in ("NEEDS_REVIEW", "FAIL"):
                    # Duplicate guard for ReviewCase
                    existing_case = db.execute(
                        select(ReviewCase).where(
                            ReviewCase.tender_id == uuid.UUID(tender_id),
                            ReviewCase.bidder_id == b.id,
                            ReviewCase.criterion_id == c.id,
                        )
                    ).scalars().first()

                    if not existing_case:
                        db.add(ReviewCase(
                            tender_id=uuid.UUID(tender_id),
                            bidder_id=b.id,
                            criterion_id=c.id,
                            status="OPEN",
                            reason=result["reason"],
                            created_at=datetime.utcnow()
                        ))
                count += 1

            db.commit()  # commit per bidder so partial progress is saved

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
