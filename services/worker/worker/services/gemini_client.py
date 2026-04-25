from __future__ import annotations

import json
import google.generativeai as genai
from worker.config import settings

class GeminiClient:
    def __init__(self):
        if not settings.gemini_api_key:
            print("WARNING: Gemini API key is EMPTY!")
        genai.configure(api_key=settings.gemini_api_key, transport="rest")
        self.model = genai.GenerativeModel("gemini-flash-latest")

    def extract_criteria(self, text: str) -> list[dict]:
        prompt = f"""
        Extract procurement criteria from the following tender document text.
        Return a JSON list of objects with the following keys:
        - text: The description of the criterion
        - type: One of [FINANCIAL, TECHNICAL, COMPLIANCE, CERTIFICATION]
        - threshold: Any numeric threshold mentioned (e.g. "15 Cr"), or null
        - mandatory: Boolean, whether it's a mandatory requirement
        - source_page: The likely page number this came from (best guess if not clear)

        Document Text:
        {text[:30000]}  # Limit text to avoid token overflow
        
        JSON Output:
        """
        response = self.model.generate_content(prompt)
        try:
            # Clean response text in case it includes markdown code blocks
            raw = response.text.strip()
            if raw.startswith("```json"):
                raw = raw[7:-3]
            elif raw.startswith("```"):
                raw = raw[3:-3]
            return json.loads(raw)
        except Exception as e:
            print(f"Failed to parse Gemini output: {e}")
            return []

    def evaluate_criterion(self, criterion_text: str, evidence_text: str) -> dict:
        prompt = f"""
        Evaluate if the following bidder evidence satisfies the tender criterion.
        
        Criterion: {criterion_text}
        Evidence: {evidence_text}

        Return a JSON object with:
        - verdict: One of [PASS, FAIL, NEEDS_REVIEW]
        - reason: A concise explanation of the verdict
        - confidence: A float between 0.0 and 1.0

        JSON Output:
        """
        response = self.model.generate_content(prompt)
        try:
            raw = response.text.strip()
            if raw.startswith("```json"):
                raw = raw[7:-3]
            elif raw.startswith("```"):
                raw = raw[3:-3]
            return json.loads(raw)
        except Exception:
            return {"verdict": "NEEDS_REVIEW", "reason": "AI parsing failed", "confidence": 0.0}

gemini_client = GeminiClient()
