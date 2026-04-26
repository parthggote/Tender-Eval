from __future__ import annotations

import json
import time
from google import genai
from google.genai import types
from worker.config import settings


class GeminiClient:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    def _generate(self, prompt: str, retries: int = 3) -> str:
        for attempt in range(retries):
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",  # free tier: 10 RPM, 250 RPD
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
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

    def extract_criteria(self, text: str) -> list[dict]:
        prompt = f"""Extract procurement evaluation criteria from this tender document.
Return a JSON array of objects with keys:
- text: criterion description
- type: one of [FINANCIAL, TECHNICAL, COMPLIANCE, CERTIFICATION]
- threshold: numeric threshold string or null
- mandatory: boolean
- source_page: integer page number or null

Tender text:
{text[:28000]}"""

        try:
            raw = self._generate(prompt).strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(raw)
        except Exception as e:
            print(f"[gemini] extract_criteria parse error: {e}")
            return []

    def evaluate_criterion(self, criterion_text: str, evidence_text: str) -> dict:
        prompt = f"""Evaluate if the bidder evidence satisfies the tender criterion.

Criterion: {criterion_text}
Evidence: {evidence_text}

Return a JSON object with:
- verdict: one of [PASS, FAIL, NEEDS_REVIEW]
- reason: concise explanation
- confidence: float 0.0-1.0"""

        try:
            raw = self._generate(prompt).strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(raw)
        except Exception:
            return {"verdict": "NEEDS_REVIEW", "reason": "AI parsing failed", "confidence": 0.0}


gemini_client = GeminiClient()
