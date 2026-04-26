FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install the API package first so worker can import app.db.models
COPY api/ /api
RUN pip install --no-cache-dir /api

# Install worker deps
COPY worker/pyproject.toml .
RUN pip install --no-cache-dir .

COPY worker/ .

# health.py: raw socket server — no framework, ~1MB vs ~15MB for http.server module
# solo pool + max-tasks-per-child=1 releases memory after every task
EXPOSE 8001
CMD sh -c "python health.py & celery -A worker.celery_app:celery worker --loglevel=info --pool=solo --concurrency=1 --max-tasks-per-child=1"
