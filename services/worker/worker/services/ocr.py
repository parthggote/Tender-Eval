from __future__ import annotations

import io
from pypdf import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image

def perform_ocr(file_bytes: bytes) -> list[dict]:
    """
    Extracts text from PDF bytes. 
    Tries pypdf first (fast), falls back to Tesseract OCR if text is sparse.
    """
    pages = []
    
    # 1. Try pypdf (fast text extraction)
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            # If we got a decent amount of text, assume it's a text-based PDF
            if text and len(text.strip()) > 100:
                pages.append({
                    "page_number": i + 1,
                    "text": text,
                    "confidence": 1.0
                })
    except Exception as e:
        print(f"pypdf failed: {e}")
        
    # 2. If no text found (or very little), use Tesseract
    if not pages:
        try:
            images = convert_from_bytes(file_bytes)
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                pages.append({
                    "page_number": i + 1,
                    "text": text,
                    "confidence": 0.85 # Heuristic for OCR
                })
        except Exception as e:
            print(f"OCR failed: {e}")
            
    return pages
