from __future__ import annotations

import json
import time
from google import genai
from worker.config import settings


class GeminiClient:
    def __init__(self):
        # Support comma-separated list of API keys for round-robin fallback
        raw_keys = getattr(settings, "gemini_api_keys", "") or settings.gemini_api_key
        self._api_keys: list[str] = [k.strip() for k in raw_keys.split(",") if k.strip()]
        self._clients: dict[str, genai.Client] = {}

    def _get_client(self, api_key: str) -> genai.Client:
        if api_key not in self._clients:
            self._clients[api_key] = genai.Client(
                api_key=api_key,
                http_options={"api_version": "v1"},
            )
        return self._clients[api_key]

    def _generate(self, prompt: str, retries: int = 3) -> str:
        """
        Try each API key in order. On 429/503/UNAVAILABLE errors, rotate to the
        next key before sleeping. Falls back gracefully if all keys are exhausted.
        """
        if not self._api_keys:
            raise RuntimeError("[gemini] No API keys configured (GEMINI_API_KEY is empty)")

        keys = list(self._api_keys)  # copy so we can rotate
        last_error: Exception | None = None

        for attempt in range(retries):
            # Rotate key each attempt so a 503 on key[0] tries key[1] next
            api_key = keys[attempt % len(keys)]
            client = self._get_client(api_key)
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",  # free tier: 10 RPM, 250 RPD
                    contents=prompt,
                )
                return response.text or ""
            except Exception as e:
                last_error = e
                msg = str(e)
                is_rate_limit = "429" in msg or "RESOURCE_EXHAUSTED" in msg
                is_unavailable = "503" in msg or "UNAVAILABLE" in msg

                if is_rate_limit or is_unavailable:
                    wait = (attempt + 1) * 10  # 10s, 20s, 30s
                    reason = "rate limited" if is_rate_limit else "unavailable (503)"
                    key_hint = f"key ...{api_key[-6:]}" if len(api_key) > 6 else "key"
                    print(
                        f"[gemini] {reason} on {key_hint}, "
                        f"retrying in {wait}s (attempt {attempt + 1}/{retries})"
                    )
                    time.sleep(wait)
                else:
                    raise

        # All retries exhausted
        raise RuntimeError(f"[gemini] All {retries} attempts failed. Last error: {last_error}")

    def _parse_json(self, raw: str) -> str:
        """Strip markdown code fences if present."""
        raw = raw.strip()
        if raw.startswith("```"):
            # Remove opening fence (```json or ```)
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            # Remove closing fence
            if raw.endswith("```"):
                raw = raw[:-3]
        return raw.strip()

    def extract_criteria(self, text: str) -> list[dict]:
        prompt = f"""Extract procurement evaluation criteria from this tender document.
Return ONLY a JSON array, no explanation. Each object must have:
- text: criterion description
- type: one of [FINANCIAL, TECHNICAL, COMPLIANCE, CERTIFICATION]
- threshold: numeric threshold string or null
- mandatory: boolean
- source_page: integer page number or null

Tender text:
{text[:28000]}"""

        try:
            raw = self._parse_json(self._generate(prompt))
            return json.loads(raw)
        except Exception as e:
            print(f"[gemini] extract_criteria parse error: {e}")
            return []

    def evaluate_criterion(self, criterion_text: str, evidence_text: str) -> dict:
        prompt = f"""Evaluate if the bidder evidence satisfies the tender criterion.
Return ONLY a JSON object, no explanation.

Criterion: {criterion_text}
Evidence: {evidence_text}

JSON keys:
- verdict: one of [PASS, FAIL, NEEDS_REVIEW]
- reason: concise explanation
- confidence: float 0.0-1.0"""

        try:
            raw = self._parse_json(self._generate(prompt))
            return json.loads(raw)
        except Exception:
            return {"verdict": "NEEDS_REVIEW", "reason": "AI parsing failed", "confidence": 0.0}


gemini_client = GeminiClient()
