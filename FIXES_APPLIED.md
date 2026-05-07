# Tender Evaluation System - Fixes Applied

## Issues Fixed

### 1. ✅ Gemini API Quota Exhausted
**Problem:** `GEMINI_API_KEY` was empty, causing immediate 429 errors with "limit: 0"

**Solution:** 
- Updated `.env` file to include placeholder for Gemini API key
- **ACTION REQUIRED:** Get your free API key from https://aistudio.google.com/apikey
- Replace `YOUR_GEMINI_API_KEY_HERE` in `services/worker/.env` with your actual key

### 2. ✅ Groq Fallback Payload Too Large
**Problem:** When evaluating 18 criteria with full evidence, the request exceeded Groq's 12K token limit (33,423 tokens requested)

**Solution:**
- Added intelligent chunking in `gemini_client.py`
- New `_evaluate_criteria_chunked()` method splits large batches into chunks of 5 criteria
- Automatically falls back to chunking when Groq returns 413 Payload Too Large
- Each chunk is evaluated separately and results are merged

### 3. ✅ DOCX File Processing Failure
**Problem:** DOCX files were being treated as PDFs, causing OCR failures with "invalid pdf header: b'PK\x03\x04\n'"

**Solution:**
- Added DOCX detection in `ocr.py` using magic bytes (ZIP signature)
- Implemented `_extract_docx_text()` to parse DOCX XML structure
- Extracts text from `word/document.xml` with proper namespace handling
- DOCX content is treated as a single "page" with 1.0 confidence

### 4. ✅ Empty Evaluation Results
**Problem:** All 18 criteria showing "No AI result returned for this criterion"

**Root Cause:** Combination of issues #1 and #2 above
- Gemini failed due to missing API key
- Groq fallback failed due to payload size
- System fell back to default NEEDS_REVIEW status

**Solution:** Fixed by addressing issues #1 and #2

## Files Modified

1. `services/worker/.env` - Added Gemini API key placeholder
2. `services/worker/worker/services/gemini_client.py` - Added chunking for large payloads
3. `services/worker/worker/services/ocr.py` - Added DOCX support

## Next Steps

### Required Actions:
1. **Get Gemini API Key:**
   - Visit https://aistudio.google.com/apikey
   - Create a new API key (free tier available)
   - Update `services/worker/.env`: Replace `YOUR_GEMINI_API_KEY_HERE` with your key

2. **Restart Worker Service:**
   ```bash
   # Stop the current worker
   # Restart with new configuration
   ```

3. **Re-upload Failed Documents:**
   - The DOCX file that failed (`sample_tender_document_1_.docx`) should be re-uploaded
   - It will now be processed correctly

### Optional Optimizations:

1. **Multiple Gemini Keys (for higher throughput):**
   ```env
   GEMINI_API_KEYS=key1,key2,key3
   ```
   This enables round-robin across multiple projects/keys

2. **Adjust Chunk Size:**
   - Current: 5 criteria per chunk for Groq fallback
   - Can be tuned in `_evaluate_criteria_chunked()` if needed

## Testing

After applying fixes and adding your Gemini API key:

1. Upload a tender document (PDF or DOCX)
2. Wait for criteria extraction to complete
3. Upload bidder documents
4. Trigger evaluation
5. Verify that criteria show proper verdicts (PASS/FAIL/NEEDS_REVIEW) instead of "No AI result returned"

## Technical Details

### Groq Token Limits:
- Free tier: 300K TPM (tokens per minute), 1K RPM (requests per minute)
- Model: llama-3.3-70b-versatile
- Max tokens per request: ~12K (context window limit)

### Chunking Strategy:
- Evaluates 5 criteria at a time when payload is too large
- Each chunk includes criterion text + evidence (up to 3 passages per criterion)
- Results are merged back into a single response dict

### DOCX Format:
- DOCX files are ZIP archives containing XML
- Main content in `word/document.xml`
- Uses OpenXML namespace: `http://schemas.openxmlformats.org/wordprocessingml/2006/main`
- Text extracted from `<w:t>` elements within `<w:p>` (paragraph) elements
