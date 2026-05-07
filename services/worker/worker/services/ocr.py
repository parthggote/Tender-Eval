from __future__ import annotations

import io
import zipfile
from pypdf import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image

def _extract_docx_text(file_bytes: bytes) -> str:
    """
    Extract text from DOCX file (which is a ZIP archive containing XML).
    Returns concatenated text from all paragraphs.
    """
    try:
        from xml.etree import ElementTree as ET
        
        # DOCX files are ZIP archives
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
            # The main document content is in word/document.xml
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Extract all text elements (namespace-aware)
            # Word XML uses namespaces like {http://schemas.openxmlformats.org/wordprocessingml/2006/main}
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = tree.findall('.//w:p', namespace)
            
            text_parts = []
            for para in paragraphs:
                texts = para.findall('.//w:t', namespace)
                para_text = ''.join(t.text or '' for t in texts)
                if para_text.strip():
                    text_parts.append(para_text)
            
            return '\n'.join(text_parts)
    except Exception as e:
        print(f"[ocr] DOCX extraction failed: {e}")
        return ""

def _is_docx(file_bytes: bytes) -> bool:
    """Check if file is a DOCX by looking at the magic bytes (ZIP signature)."""
    return file_bytes[:4] == b'PK\x03\x04'

def perform_ocr(file_bytes: bytes) -> list[dict]:
    """
    Extracts text from PDF or DOCX bytes. 
    For PDFs: tries pypdf first (fast), falls back to Tesseract OCR if text is sparse.
    For DOCX: extracts text directly from the XML structure.
    """
    pages = []
    
    # Check if this is a DOCX file
    if _is_docx(file_bytes):
        print("[ocr] Detected DOCX file, extracting text...")
        text = _extract_docx_text(file_bytes)
        if text:
            # Treat entire DOCX as a single "page"
            pages.append({
                "page_number": 1,
                "text": text,
                "confidence": 1.0
            })
            return pages
        else:
            print("[ocr] DOCX text extraction returned empty, treating as failure")
            return pages
    
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
        print(f"[ocr] pypdf failed: {e}")
        
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
            print(f"[ocr] Tesseract OCR failed: {e}")
            
    return pages
