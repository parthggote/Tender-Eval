from __future__ import annotations

import json
import time
from google import genai
from worker.config import settings


class GeminiClient:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            # http_options forces v1 endpoint — gemini-2.5-flash is not on v1beta
            self._client = genai.Client(
                api_key=settings.gemini_api_key,
                http_options={"api_version": "v1"},
            )
        return self._client

    def _generate(self, prompt: str, retries: int = 3) -> str:
        for attempt in range(retries):
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",  # free tier: 10 RPM, 250 RPD
                    contents=prompt,
                )
                return response.text or ""
            except Exception as e:
                msg = str(e)
                if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    wait = (attempt + 1) * 10  # 10s, 20s, 30s
                    print(f"[gemini] rate limited, retrying in {wait}s (attempt {attempt + 1}/{retries})")
                    time.sleep(wait)
                else:
                    raise
        return ""

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
