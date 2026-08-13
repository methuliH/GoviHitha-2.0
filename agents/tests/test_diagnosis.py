"""Test harness for CropDiagnosisAgent.

Usage:
    # Mock mode (no API key needed):
    python -m agents.tests.test_diagnosis

    # Live mode (requires GOOGLE_API_KEY in .env):
    python -m agents.tests.test_diagnosis --live
"""
from __future__ import annotations

import base64
import json
import sys
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Sample images: PlantVillage dataset hosted on GitHub (public, no auth)
# ---------------------------------------------------------------------------
SAMPLE_IMAGES = [
    {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Riceblight.jpg/320px-Riceblight.jpg",
        "crop_type": "rice",
        "symptoms": "Brown lesions on leaf edges, yellowing spreading inward",
        "region": "Colombo",
        "label": "Rice Bacterial Leaf Blight",
    },
    {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Tomato_leaf_curl_virus.jpg/320px-Tomato_leaf_curl_virus.jpg",
        "crop_type": "tomato",
        "symptoms": "Leaves curling upward, yellowing, stunted growth",
        "region": "Kandy",
        "label": "Tomato Leaf Curl Virus",
    },
]


def _mock_result() -> dict:
    return {
        "disease_name": "Rice Leaf Blast",
        "confidence": 0.91,
        "description": "Fungal infection caused by Magnaporthe oryzae, common in humid Sri Lankan regions.",
        "treatment_steps": [
            "Apply Tricyclazole fungicide at 0.6g/L concentration",
            "Improve field drainage to reduce humidity",
            "Remove and destroy infected plant material",
        ],
        "timeline": "7–10 days with consistent treatment",
        "prevention": "Use blast-resistant varieties, avoid excess nitrogen fertiliser, rotate crops.",
        "risk_level": "high",
        "error": None,
    }


def run_mock() -> None:
    print("=" * 60)
    print("MOCK MODE — no API calls made")
    print("=" * 60)
    from agents.schemas.diagnosis_schema import DiagnosisResult
    result = DiagnosisResult.model_validate(_mock_result())
    print(json.dumps(result.model_dump(), indent=2))
    print("\n[OK] Mock DiagnosisResult validated successfully")


def _download_image(url: str) -> bytes:
    print(f"  Downloading: {url}")
    with urllib.request.urlopen(url, timeout=15) as resp:  # noqa: S310
        return resp.read()


def run_live() -> None:
    print("=" * 60)
    print("LIVE MODE — real Gemini API calls")
    print("=" * 60)

    from agents.agents.crop_diagnosis import CropDiagnosisAgent

    agent = CropDiagnosisAgent()
    all_passed = True

    for i, sample in enumerate(SAMPLE_IMAGES, 1):
        print(f"\n[{i}/{len(SAMPLE_IMAGES)}] {sample['label']}")
        print(f"  Crop: {sample['crop_type']}  Region: {sample['region']}")
        print(f"  Symptoms: {sample['symptoms']}")

        try:
            image_bytes = _download_image(sample["url"])
        except Exception as exc:
            print(f"  [FAIL] Could not download image: {exc}")
            all_passed = False
            continue

        image_b64 = base64.b64encode(image_bytes).decode()
        result = agent.diagnose(
            crop_type=sample["crop_type"],
            symptoms=sample["symptoms"],
            image_source=image_b64,
            region=sample["region"],
        )

        print(json.dumps(result.model_dump(), indent=2))

        if result.error:
            print(f"  [FAIL] Error field set: {result.error}")
            all_passed = False
        else:
            print(f"  [OK] Diagnosed: {result.disease_name} (confidence={result.confidence:.2f})")

    print("\n" + ("[OK] All tests passed" if all_passed else "[FAIL] Some tests failed"))


def run_bad_image() -> None:
    """Verify error handling — bad input must not raise."""
    print("\n[Error handling test] Bad base64 input")
    from agents.agents.crop_diagnosis import CropDiagnosisAgent
    result = CropDiagnosisAgent().diagnose(
        crop_type="rice",
        symptoms="yellowing",
        image_source="not-valid-base64!!!",
        region="Colombo",
    )
    assert result.error is not None, "Expected error field to be set"
    assert result.disease_name == "Unable to Diagnose"
    print("  [OK] Graceful fallback confirmed")


if __name__ == "__main__":
    live = "--live" in sys.argv
    if live:
        run_live()
        run_bad_image()
    else:
        run_mock()
        run_bad_image()
