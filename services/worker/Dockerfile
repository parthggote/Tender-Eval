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

# Render web services require a bound port — run a minimal health server alongside celery
EXPOSE 8001
CMD sh -c "python -m http.server 8001 & celery -A worker.celery_app:celery worker --loglevel=info"
