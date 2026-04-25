# Local Development

## Prereqs

- Node.js >= 20 (Corepack recommended for `pnpm`)
- Python >= 3.11 (for `services/api` and `services/worker`)
- Docker (optional, for Postgres/Redis/MinIO/Qdrant)

## Infra (Docker)

From `tender-eval-platform/`:

```bash
docker compose up -d
```

## JS (Officer Portal)

From `tender-eval-platform/`:

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm install
pnpm --filter=officer-portal dev
```

Env: copy `.env.example` to `.env` and set `AUTH_SECRET`, `DATABASE_URL`, and `NEXT_PUBLIC_INTERNAL_API_URL`.

## API (FastAPI)

From `tender-eval-platform/services/api`:

```bash
python -m venv .venv
python -m pip install -U pip
python -m pip install -e .
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Worker (Celery)

From `tender-eval-platform/services/worker`:

```bash
python -m venv .venv
python -m pip install -U pip
python -m pip install -e .
celery -A worker.celery_app:celery worker --loglevel=INFO
```

