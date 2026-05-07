#!/usr/bin/env python3
"""
Quick test script to verify Groq fallback functionality.
Run this before deploying to ensure the configuration works.
"""

import os
import sys

# Add worker to path
sys.path.insert(0, os.path.dirname(__file__))

from worker.services.gemini_client import GeminiClient


def test_groq_only():
    """Test Groq when no Gemini keys are configured."""
    print("\n=== Test 1: Groq-only mode ===")
    
    # Temporarily clear Gemini keys
    import worker.config as config_module
    original_keys = config_module.settings.gemini_api_key
    config_module.settings.gemini_api_key = ""
    config_module.settings.gemini_api_keys = ""
    
    try:
        client = GeminiClient()
        
        if not client._groq_client:
            print("❌ FAIL: Groq client not initialized. Check GROQ_API_KEY in .env")
            return False
        
        print("✓ Groq client initialized")
        
        # Test simple extraction
        test_text = """
        The bidder must have:
        1. ISO 9001 certification
        2. Minimum 5 years experience
        3. Annual revenue above $1M
        """
        
        print("Testing criteria extraction with Groq...")
        result = client.extract_criteria(test_text)
        
        if result and len(result) > 0:
            print(f"✓ Successfully extracted {len(result)} criteria")
            for i, criterion in enumerate(result, 1):
                print(f"  {i}. {criterion['text'][:60]}... ({criterion['type']})")
            return True
        else:
            print("❌ FAIL: No criteria extracted")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False
    finally:
        # Restore original keys
        config_module.settings.gemini_api_key = original_keys


def test_gemini_fallback():
    """Test fallback from Gemini to Groq."""
    print("\n=== Test 2: Gemini → Groq fallback ===")
    
    client = GeminiClient()
    
    if not client._groq_client:
        print("⚠️  SKIP: Groq not configured (GROQ_API_KEY missing)")
        return None
    
    if not client._api_keys:
        print("⚠️  SKIP: No Gemini keys configured (will use Groq directly)")
        return None
    
    print("✓ Both Gemini and Groq configured")
    print("  Note: Fallback will trigger automatically on rate limits")
    print("  This test just verifies the configuration is correct")
    
    return True


def test_json_parsing():
    """Test JSON parsing with markdown fences."""
    print("\n=== Test 3: JSON parsing ===")
    
    client = GeminiClient()
    
    # Test with markdown fences
    test_cases = [
        '{"test": "value"}',
        '```json\n{"test": "value"}\n```',
        '```\n{"test": "value"}\n```',
    ]
    
    for i, test_input in enumerate(test_cases, 1):
        result = client._parse_json(test_input)
        if result == '{"test": "value"}':
            print(f"✓ Test case {i} passed")
        else:
            print(f"❌ Test case {i} failed: {result}")
            return False
    
    return True


def main():
    print("=" * 60)
    print("Groq Fallback Configuration Test")
    print("=" * 60)
    
    # Check environment
    groq_key = os.getenv("GROQ_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    gemini_keys = os.getenv("GEMINI_API_KEYS", "")
    
    print("\nEnvironment Configuration:")
    print(f"  GROQ_API_KEY: {'✓ Set' if groq_key else '✗ Not set'}")
    print(f"  GEMINI_API_KEY: {'✓ Set' if gemini_key else '✗ Not set'}")
    print(f"  GEMINI_API_KEYS: {'✓ Set' if gemini_keys else '✗ Not set'}")
    
    if not groq_key:
        print("\n❌ ERROR: GROQ_API_KEY not set in environment")
        print("   Get your key from: https://console.groq.com/keys")
        print("   Add it to services/worker/.env")
        return 1
    
    # Run tests
    results = []
    
    results.append(("JSON Parsing", test_json_parsing()))
    results.append(("Groq-only Mode", test_groq_only()))
    results.append(("Fallback Config", test_gemini_fallback()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for name, result in results:
        if result is True:
            status = "✓ PASS"
        elif result is False:
            status = "✗ FAIL"
        else:
            status = "⊘ SKIP"
        print(f"  {status}: {name}")
    
    failed = sum(1 for _, r in results if r is False)
    
    if failed > 0:
        print(f"\n❌ {failed} test(s) failed")
        return 1
    else:
        print("\n✓ All tests passed!")
        print("\nYou can now:")
        print("  1. Add your GROQ_API_KEY to services/worker/.env")
        print("  2. Restart the Celery worker")
        print("  3. The system will automatically fall back to Groq on rate limits")
        return 0


if __name__ == "__main__":
    sys.exit(main())
