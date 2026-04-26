from __future__ import annotations

import json
from google import genai
from google.genai import types
from worker.config import settings


class GeminiClient:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if not settings.gemini_api_key:
                print("WARNING: Gemini API key is EMPTY!")
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    def _generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return response.text or ""

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
