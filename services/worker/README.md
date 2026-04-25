# Worker (Celery)

This service runs background jobs for:

- OCR + parsing
- Hybrid indexing (BM25 + embeddings)
- Evidence mapping
- Deterministic evaluation + LLM judge (qualitative)
- Report export

## Run (dev)

```bash
celery -A worker.celery_app:celery worker --loglevel=INFO
```

