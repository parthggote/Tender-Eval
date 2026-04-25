# Internal API (FastAPI)

This service owns tender-domain orchestration and persistence (tenders, bidders, criteria, evidence, evaluations, review cases, audit log, and exports).

## Run (dev)

```bash
uvicorn app.main:app --reload --port 8000
```

## Auth between portal and API

The officer portal calls this API with signed headers:

- `X-User-Id`
- `X-User-Timestamp`
- `X-User-Signature` (HMAC-SHA256 over `{userId}.{timestamp}` using `AUTH_SECRET`)

The API validates the signature and timestamp window to prevent spoofing and basic replay.

