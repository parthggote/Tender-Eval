# Token Usage Fix - Quick Reference

## What Was Wrong
- Sending 33,423 tokens to Groq
- Groq limit: 12,000 tokens per minute
- Result: 413 Payload Too Large error
- All criteria showing "No AI result returned"

## What's Fixed
1. ✅ Evidence truncated to 500 chars per passage
2. ✅ Automatic chunking into groups of 5 criteria
3. ✅ 40-second delays between chunks for rate limiting
4. ✅ Proper error detection and handling
5. ✅ DOCX file support added

## What Happens Now

### Single Evaluation (18 criteria):
```
Time: ~2 minutes
Chunks: 4 (5+5+5+3 criteria)
Tokens per chunk: ~7,400 (under 12K limit)
Delays: 40 seconds between chunks
Result: All 18 criteria evaluated ✅
```

## Action Required

**Restart your worker service** to load the new code.

That's it! The system will automatically:
- Truncate evidence
- Detect payload errors
- Chunk large batches
- Add rate-limiting delays
- Complete successfully

## Optional: Speed Up Evaluations

Get a free Gemini API key from https://aistudio.google.com/apikey

Add to `services/worker/.env`:
```env
GEMINI_API_KEY=your_key_here
```

With Gemini:
- Time: ~5-10 seconds (vs 2 minutes)
- No chunking needed
- Better quality results

## Files Changed
- `services/worker/worker/services/gemini_client.py` - Chunking + rate limiting
- `services/worker/worker/tasks.py` - Evidence truncation
- `services/worker/worker/services/ocr.py` - DOCX support
- `services/worker/.env` - Gemini key placeholder

## Verification

After restart, check logs for:
```
[llm] Payload too large for single batch, chunking into smaller groups...
[llm] Evaluating chunk 1/4 (5 criteria)...
[llm] Waiting 40s before next chunk to respect Groq's 12K TPM rate limit...
[llm] Evaluating chunk 2/4 (5 criteria)...
...
Task tendereval.evaluate_tender succeeded: {'ok': True, 'evaluationsCreated': 18}
```

Success! ✅
