FROM python:3.11-slim

# System deps for pytesseract + pdf2image
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY . .

RUN chmod +x entrypoint.sh

# Runs migrations then starts the server on every deploy
CMD ["./entrypoint.sh"]
