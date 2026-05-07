# Testing the Chunking Fix

## The Problem

Your logs show:
```
[groq] Error: Error code: 413 - {'error': {'message': 'Request too large...'}}
[llm] evaluate_criteria_batch parse error: [groq] API call failed: Error code: 413
```

The error is being caught as a "parse error" instead of triggering chunking.

## Why It Wasn't Working

The exception handling had two separate blocks:
1. `except RuntimeError as e:` - checks for payload errors
2. `except Exception as e:` - catches everything else

The Groq error was being caught by the second block before the first could check for "413".

## The Fix Applied

Changed to a single exception handler that checks ALL exceptions for payload errors:

```python
except (RuntimeError, Exception) as e:
    error_msg = str(e)
    # Check for payload size errors in ANY exception type
    if "413" in error_msg or "Payload Too Large" in error_msg or "Request too large" in error_msg or "PAYLOAD_TOO_LARGE" in error_msg:
        print(f"[llm] Payload too large for single batch, chunking into smaller groups...")
        return self._evaluate_criteria_chunked(criteria, evidence_map)
    # ... rest of error handling
```

## What Should Happen Now

### Step 1: Initial Attempt
```
[evaluate_tender] Evaluating 18 criteria for bidder xxx in one call…
[groq] Calling llama-3.3-70b-versatile...
[groq] Error: Error code: 413 - Request too large...
```

### Step 2: Chunking Triggered
```
[llm] Payload too large for single batch, chunking into smaller groups...
[llm] Evaluating chunk 1/4 (5 criteria)...
[groq] Calling llama-3.3-70b-versatile...
```

### Step 3: Success
```
[llm] Evaluating chunk 2/4 (5 criteria)...
[llm] Evaluating chunk 3/4 (5 criteria)...
[llm] Evaluating chunk 4/4 (3 criteria)...
Task tendereval.evaluate_tender succeeded: {'ok': True, 'evaluationsCreated': 18}
```

## Token Calculations with Current Settings

### Per Chunk (5 criteria):
```
Evidence per criterion: 500 chars/passage × 3 passages = 1,500 chars
Total evidence: 5 criteria × 1,500 chars = 7,500 chars
Criterion text: 5 × ~100 chars = 500 chars
Prompt template: ~500 chars
Total: ~8,500 chars ≈ 7,400 tokens ✅ (under 12K limit)
```

### All 4 Chunks:
```
Chunk 1: 5 criteria = ~7,400 tokens ✅
Chunk 2: 5 criteria = ~7,400 tokens ✅
Chunk 3: 5 criteria = ~7,400 tokens ✅
Chunk 4: 3 criteria = ~4,400 tokens ✅
Total: ~26,600 tokens across 4 requests
```

## Groq Rate Limits

From the documentation:
- **TPM (Tokens Per Minute)**: 12,000 tokens
- **RPM (Requests Per Minute)**: 30 requests

### Our Usage:
- 4 requests in quick succession
- Each request: ~7,400 tokens
- Total tokens: ~26,600 tokens

**Problem**: We'll exceed the 12K TPM limit even with chunking!

## Additional Fix Needed: Rate Limiting Between Chunks

The chunks are being sent too fast. We need to add delays between chunks to stay under the 12K TPM limit.

Let me add that now...
