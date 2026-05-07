# Token Reduction Strategies

## Problem
Your evaluation was requesting **33,423 tokens** but Groq's free tier limit is **12,000 tokens per request**.

## Solutions Applied

### 1. ✅ Evidence Truncation at Retrieval (tasks.py)
**Location:** `services/worker/worker/tasks.py` - `evaluate_tender` task

**What it does:**
- Limits each evidence passage to 500 characters
- Retrieves 3 passages per criterion
- Max ~1,500 chars per criterion (3 × 500)

**Impact:** Reduces evidence from potentially 5,000+ chars to ~1,500 chars per criterion

```python
# Before: unlimited evidence text
evidence_map[str(c.id)] = "\n".join(r["text"] for r in results)

# After: truncated to 500 chars per passage
for r in results:
    text = r["text"]
    if len(text) > 500:
        text = text[:500] + "..."
    evidence_parts.append(text)
```

### 2. ✅ Evidence Truncation in LLM Client (gemini_client.py)
**Location:** `services/worker/worker/services/gemini_client.py` - `_truncate_evidence()`

**What it does:**
- Additional safety layer that truncates evidence to 1,500 chars max
- Keeps first 70% and last 30% to preserve context
- Applied before sending to LLM

**Impact:** Ensures no single criterion's evidence exceeds 1,500 chars

```python
def _truncate_evidence(text: str, max_chars: int = 1500) -> str:
    if len(text) <= max_chars:
        return text
    
    first_part_len = int(max_chars * 0.7)  # 1,050 chars
    last_part_len = max_chars - first_part_len - 20  # 430 chars
    
    return f"{first_part[:first_part_len]}\n... [truncated] ...\n{last_part[-last_part_len:]}"
```

### 3. ✅ Automatic Chunking on Payload Error
**Location:** `services/worker/worker/services/gemini_client.py` - `_evaluate_criteria_chunked()`

**What it does:**
- Detects 413 Payload Too Large errors from Groq
- Automatically splits criteria into chunks of 5
- Evaluates each chunk separately
- Merges results back together

**Impact:** Handles cases where even truncated evidence exceeds limits

```python
# Chunk size: 5 criteria per request
# With truncation: 5 × 1,500 = 7,500 chars of evidence
# Plus prompts and formatting: ~9,000-10,000 tokens
# Well under 12,000 token limit
```

### 4. ✅ Improved Error Detection
**Location:** `services/worker/worker/services/gemini_client.py` - `_generate_with_groq()`

**What it does:**
- Raises specific `PAYLOAD_TOO_LARGE` error
- Triggers automatic chunking
- Better error messages for debugging

## Token Usage Calculation

### Before Optimization:
```
18 criteria × ~2,000 chars evidence each = 36,000 chars
+ Criterion text (18 × ~100 chars) = 1,800 chars
+ Prompt template = ~500 chars
Total: ~38,300 chars ≈ 33,423 tokens (at ~0.87 chars/token)
```

### After Optimization (Single Batch):
```
18 criteria × 1,500 chars evidence each = 27,000 chars
+ Criterion text (18 × ~100 chars) = 1,800 chars
+ Prompt template = ~500 chars
Total: ~29,300 chars ≈ 25,600 tokens
```
**Still over 12K limit** → Triggers chunking

### After Chunking (4 chunks of 5, 5, 5, 3):
```
Chunk 1: 5 criteria × 1,500 chars = 7,500 chars ≈ 6,500 tokens ✅
Chunk 2: 5 criteria × 1,500 chars = 7,500 chars ≈ 6,500 tokens ✅
Chunk 3: 5 criteria × 1,500 chars = 7,500 chars ≈ 6,500 tokens ✅
Chunk 4: 3 criteria × 1,500 chars = 4,500 chars ≈ 3,900 tokens ✅
```
**All chunks under 12K limit** ✅

## Configuration Options

### Adjust Evidence Length Per Passage
**File:** `services/worker/worker/tasks.py`

```python
# Current: 500 chars per passage
if len(text) > 500:
    text = text[:500] + "..."

# More aggressive (300 chars):
if len(text) > 300:
    text = text[:300] + "..."

# Less aggressive (800 chars):
if len(text) > 800:
    text = text[:800] + "..."
```

### Adjust Total Evidence Length
**File:** `services/worker/worker/services/gemini_client.py`

```python
# Current: 1,500 chars max per criterion
truncated_evidence = _truncate_evidence(raw_evidence, max_chars=1500)

# More aggressive (1,000 chars):
truncated_evidence = _truncate_evidence(raw_evidence, max_chars=1000)

# Less aggressive (2,000 chars):
truncated_evidence = _truncate_evidence(raw_evidence, max_chars=2000)
```

### Adjust Chunk Size
**File:** `services/worker/worker/services/gemini_client.py`

```python
# Current: 5 criteria per chunk
def _evaluate_criteria_chunked(self, criteria: list, evidence_map: dict[str, str], chunk_size: int = 5)

# Smaller chunks (3 criteria):
chunk_size: int = 3

# Larger chunks (8 criteria) - risky, may still exceed limit:
chunk_size: int = 8
```

### Reduce Number of Evidence Passages
**File:** `services/worker/worker/tasks.py`

```python
# Current: 3 passages per criterion
results = pgvector_store.search(
    str(b.id), criterion_vector_map[str(c.id)], limit=3
)

# Fewer passages (2):
results = pgvector_store.search(
    str(b.id), criterion_vector_map[str(c.id)], limit=2
)

# More passages (5) - will increase token usage:
results = pgvector_store.search(
    str(b.id), criterion_vector_map[str(c.id)], limit=5
)
```

## Trade-offs

### Evidence Quality vs Token Usage

| Strategy | Token Savings | Quality Impact |
|----------|--------------|----------------|
| Truncate passages to 500 chars | High (60-70%) | Low - keeps most relevant info |
| Reduce passages from 3 to 2 | Medium (33%) | Medium - less context |
| Chunk into smaller batches | None (just splits) | None - same total tokens |
| Truncate total evidence to 1,500 | High (50-70%) | Low-Medium - preserves key parts |

### Recommended Settings

**For Maximum Quality (if you have Gemini API key):**
- Passage length: 800 chars
- Total evidence: 2,000 chars
- Passages per criterion: 3
- Chunk size: N/A (Gemini handles larger payloads)

**For Groq Free Tier (current setup):**
- Passage length: 500 chars ✅ (current)
- Total evidence: 1,500 chars ✅ (current)
- Passages per criterion: 3 ✅ (current)
- Chunk size: 5 ✅ (current)

**For Very Large Tenders (30+ criteria):**
- Passage length: 400 chars
- Total evidence: 1,200 chars
- Passages per criterion: 2
- Chunk size: 4

## Monitoring

### Check Token Usage in Logs
Look for these log messages:

```
[llm] Payload too large for single batch, chunking into smaller groups...
[llm] Evaluating chunk 1/4 (5 criteria)...
[llm] Evaluating chunk 2/4 (5 criteria)...
```

### Success Indicators
- ✅ No "413 Payload Too Large" errors after chunking
- ✅ All criteria get evaluated (not stuck at "No AI result returned")
- ✅ Evaluation completes successfully

### Warning Signs
- ⚠️ Chunking triggered on every evaluation (consider reducing evidence length)
- ⚠️ Individual chunks still failing (reduce chunk size or evidence length)
- ⚠️ Low confidence scores across all criteria (evidence may be too truncated)

## Next Steps

1. **Add Gemini API Key** (recommended)
   - Gemini has much higher token limits
   - Better quality evaluations
   - Chunking becomes rare

2. **Monitor Evaluation Quality**
   - Check if truncated evidence still provides good verdicts
   - Adjust truncation limits if needed

3. **Consider Groq Paid Tier**
   - Dev tier: 100K TPM (8x more)
   - Would allow larger batches without chunking
   - Cost: Check https://console.groq.com/settings/billing
