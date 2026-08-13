"""Smoke tests for rate limiting on POST /run.

Run with the backend already started (not rate-limited by RATE_LIMIT_DISABLED):
    python agents/test_rate_limit.py

The 1x1 blank PNG image will cause Gemini to return "Unable to Diagnose",
which is expected — we're testing HTTP status codes, not diagnosis quality.
"""
import requests
import time

BASE_URL = "http://localhost:8000"

# Minimal valid 1x1 blank PNG in base64 (same as smoke-test in CLAUDE.md)
_TEST_IMAGE = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)

_VALID_BODY = {
    "crop_type": "rice",
    "symptoms": "test",
    "image_base64": _TEST_IMAGE,
    "region": "Colombo",
}


def test_per_minute_limit_triggers_429():
    responses = []
    for _ in range(6):
        r = requests.post(f"{BASE_URL}/run", json=_VALID_BODY, timeout=90)
        responses.append(r.status_code)
        time.sleep(0.1)
    assert responses[:5] != [429] * 5, "First 5 requests should not all be rate-limited"
    assert responses[5] == 429, f"6th request should be rate-limited, got {responses[5]}"
    print("✅ Per-minute limit triggers correctly at request 6")


def test_retry_after_header_present():
    for _ in range(6):
        r = requests.post(f"{BASE_URL}/run", json=_VALID_BODY, timeout=90)
    assert r.status_code == 429
    assert "Retry-After" in r.headers
    print(f"✅ Retry-After header present: {r.headers['Retry-After']}s")


if __name__ == "__main__":
    test_per_minute_limit_triggers_429()
    test_retry_after_header_present()
