FROM python:3.11-slim

# System deps for pytesseract + pdf2image
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

CMD ["celery", "-A", "worker.celery_app:celery", "worker", "--loglevel=info"]
