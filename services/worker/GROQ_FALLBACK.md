# Groq Fallback Configuration

## Overview

The worker now supports automatic fallback to Groq when Gemini API hits rate limits. This provides better reliability and higher throughput for LLM operations.

## Setup

### 1. Install Dependencies

```bash
cd services/worker
pip install groq>=0.11.0
```

Or if using the project's dependency management:

```bash
pip install -e .
```

### 2. Get a Groq API Key

1. Visit https://console.groq.com/keys
2. Sign up for a free account
3. Create a new API key

### 3. Configure Environment Variables

Add your Groq API key to `services/worker/.env`:

```bash
# Groq API key for fallback when Gemini is rate limited
GROQ_API_KEY=gsk_your_api_key_here
```

You can also keep your Gemini keys configured:

```bash
# Primary Gemini key
GEMINI_API_KEY=your_gemini_key

# Or multiple keys for rotation
GEMINI_API_KEYS=key1,key2,key3
```

## How It Works

1. **Primary Provider**: The system tries Gemini first (if keys are configured)
2. **Rate Limit Detection**: When Gemini returns 429 or RESOURCE_EXHAUSTED errors
3. **Automatic Fallback**: Switches to Groq automatically without failing the task
4. **Groq-Only Mode**: If no Gemini keys are configured, uses Groq directly

## Groq Free Tier Limits

- **Model**: llama-3.3-70b-versatile (70B parameters)
- **Speed**: ~280 tokens/second
- **Rate Limits**: 
  - 300K tokens per minute (TPM)
  - 1K requests per minute (RPM)
  - 131K context window

This is significantly more generous than Gemini's free tier (1500 requests per day).

## Benefits

- **Higher Throughput**: Groq offers much faster inference (~280 TPS vs Gemini's variable speed)
- **Better Reliability**: Automatic fallback prevents task failures
- **Cost Effective**: Free tier is very generous for development/testing
- **No Code Changes**: Existing code works without modification

## Monitoring

The worker logs will show which provider is being used:

```
[llm] Groq fallback enabled
[gemini] Rate limited on key ...abc123 (attempt 1/2)
[llm] Gemini failed, falling back to Groq...
[groq] Calling llama-3.3-70b-versatile...
```

## Troubleshooting

### Groq Not Being Used

- Check that `GROQ_API_KEY` is set in `.env`
- Restart the Celery worker after adding the key
- Check logs for "[llm] Groq fallback enabled" message

### Both Providers Failing

- Verify both API keys are valid
- Check rate limits on both platforms
- Consider adding more Gemini keys to `GEMINI_API_KEYS`

### JSON Parsing Errors

Both Gemini and Groq should return valid JSON. If you see parsing errors:
- Check the prompt format in `gemini_client.py`
- The system prompt instructs Groq to return JSON only
- Groq uses temperature=0.1 for consistent formatting

## Production Considerations

For production use, consider:

1. **Paid Tiers**: Both Gemini and Groq offer paid tiers with higher limits
2. **Multiple Keys**: Use `GEMINI_API_KEYS` with multiple keys for better distribution
3. **Monitoring**: Track which provider is being used and success rates
4. **Cost Tracking**: Monitor API usage on both platforms

## Model Comparison

| Feature | Gemini 2.0 Flash | Llama 3.3 70B (Groq) |
|---------|------------------|----------------------|
| Parameters | Unknown | 70B |
| Speed | Variable | ~280 TPS |
| Free Tier | 1500 RPD | 300K TPM, 1K RPM |
| Context | 1M tokens | 131K tokens |
| Quality | Excellent | Very Good |

Both models are suitable for procurement criteria extraction and evaluation tasks.
