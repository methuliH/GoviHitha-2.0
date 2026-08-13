"""
Throwaway reproduction script for the Crop/Disease Mismatch bug.
DO NOT add to the test suite. DO NOT modify test_adk_connection.py.

Run from the repo root:
    cd D:\\GoviHitha
    python -m agents.reproduce_crop_mismatch

Purpose:
    Reproduce the reported bug where a Tomato/Nuwara Eliya submission returned
    "Rice Leaf Blast". Prints the full raw Gemini response text before parsing.
    If the API call fails (auth, quota, timeout) the error is reported verbatim.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Exact inputs from the bug report
# ---------------------------------------------------------------------------
CROP_TYPE = "tomato"
REGION = "Nuwara Eliya"
SYMPTOMS = (
    "yellowing leaves, brown concentric spots on edges, spreading "
    "inward from older leaves, some drying/curling, leaves dropping"
)

# ---------------------------------------------------------------------------
# Image: no local tomato fixtures exist in this repo.
# Using the PlantVillage tomato-early-blight sample referenced in
# agents/test_adk_connection.py (the same URL used in that harness).
# ---------------------------------------------------------------------------
IMAGE_URL = (
    "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/"
    "master/raw/color/Tomato___Early_blight/"
    "0022d6b7-d47c-4ee2-ae9a-392a53f48647___RS_Erly.B%208461.JPG"
)
LOCAL_IMAGE = Path("reproduce_tomato_early_blight.jpg")
REPO_ROOT = Path(__file__).resolve().parents[1]
FALLBACK_IMAGE = REPO_ROOT / "frontend" / "public" / "farmland-bg.jpg"

print("=" * 70)
print("Govi Hitha — Crop/Disease Mismatch Reproduction")
print("=" * 70)
print(f"Crop:    {CROP_TYPE}")
print(f"Region:  {REGION}")
print(f"Symptoms: {SYMPTOMS}")
print()

# ---------------------------------------------------------------------------
# Step 1: obtain image bytes
# ---------------------------------------------------------------------------
print("[1] Acquiring test image...")
if LOCAL_IMAGE.exists() and LOCAL_IMAGE.stat().st_size > 1000:
    print(f"    Using cached local file: {LOCAL_IMAGE}")
    image_source = str(LOCAL_IMAGE)
else:
    print(f"    No local tomato image found in repo fixtures.")
    print(f"    Downloading from PlantVillage (same URL as test_adk_connection.py):")
    print(f"    {IMAGE_URL}")
    try:
        urllib.request.urlretrieve(IMAGE_URL, LOCAL_IMAGE)
        print(f"    Downloaded {LOCAL_IMAGE.stat().st_size} bytes -> {LOCAL_IMAGE}")
        image_source = str(LOCAL_IMAGE)
    except Exception as exc:
        print(f"    [WARN] PlantVillage download failed: {type(exc).__name__}: {exc}")
        print(f"    Falling back to repo-local image: {FALLBACK_IMAGE}")
        print("    NOTE: This is the frontend background image, NOT a tomato disease sample.")
        print("    The model will likely produce a nonsensical diagnosis — this tests the")
        print("    code path only, not the model's accuracy on tomato disease imagery.")
        if FALLBACK_IMAGE.exists():
            image_source = str(FALLBACK_IMAGE)
        else:
            print("    [FAIL] Fallback image also not found. Cannot proceed. Aborting.")
            sys.exit(1)

# ---------------------------------------------------------------------------
# Step 2: load image bytes (via the production utility, not mocked)
# ---------------------------------------------------------------------------
print("\n[2] Loading image via production image_processor.load_image()...")
try:
    from agents.utils.image_processor import load_image
    image_bytes, mime_type = load_image(image_source)
    print(f"    Loaded {len(image_bytes)} bytes, mime_type={mime_type}")
except Exception as exc:
    print(f"    [FAIL] {type(exc).__name__}: {exc}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 3: build the identical user_prompt that CropDiagnosisAgent would build
# ---------------------------------------------------------------------------
print("\n[3] Building user_prompt (matches crop_diagnosis.py lines 58-63)...")
from agents.prompts.crop_diagnosis_prompt import CROP_DIAGNOSIS_PROMPT

user_prompt = (
    f"Crop: {CROP_TYPE}\n"
    f"Region: {REGION} (Sri Lanka)\n"
    f"Farmer-reported symptoms: {SYMPTOMS}\n\n"
    "Diagnose the disease shown in the image."
)
print(f"    user_prompt:\n{user_prompt}")

# ---------------------------------------------------------------------------
# Step 4: call Gemini directly (captures raw response before any parsing)
# ---------------------------------------------------------------------------
print("\n[4] Calling Gemini Vision API (real call — no mock)...")
print("    This will fail if GOOGLE_API_KEY is unset and ADC is not configured.")

try:
    from agents.tools.gemini_vision import call_gemini_vision
    raw_text = call_gemini_vision(
        image_bytes=image_bytes,
        mime_type=mime_type,
        user_prompt=user_prompt,
        system_prompt=CROP_DIAGNOSIS_PROMPT,
        timeout=30,
    )
    print("\n--- RAW GEMINI RESPONSE (verbatim, before any parsing) ---")
    print(raw_text)
    print("--- END RAW RESPONSE ---")
except Exception as exc:
    print(f"\n    [API CALL FAILED] {type(exc).__name__}: {exc}")
    print("    Root cause of this failure is reported verbatim above.")
    print("    Aborting — not working around the API failure.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 5: attempt JSON parse (same logic as CropDiagnosisAgent)
# ---------------------------------------------------------------------------
print("\n[5] Parsing raw response via CropDiagnosisAgent pipeline...")
try:
    from agents.agents.crop_diagnosis import CropDiagnosisAgent
    agent = CropDiagnosisAgent()
    result = agent.diagnose(
        crop_type=CROP_TYPE,
        symptoms=SYMPTOMS,
        image_source=image_source,
        region=REGION,
    )
    print("\n--- PARSED DiagnosisResult ---")
    print(json.dumps(result.model_dump(), indent=2))
    print("--- END DiagnosisResult ---")

    print("\n[SUMMARY]")
    print(f"  disease_name : {result.disease_name}")
    print(f"  confidence   : {result.confidence}")
    print(f"  risk_level   : {result.risk_level}")
    if result.error:
        print(f"  error        : {result.error}")

    # Plausibility check — flag a rice-disease response for a tomato input
    rice_disease_keywords = ["blast", "planthopper", "sheath blight", "tungro"]
    if any(kw in result.disease_name.lower() for kw in rice_disease_keywords):
        print("\n[BUG CONFIRMED] disease_name contains a rice-disease keyword "
              f"despite crop_type='{CROP_TYPE}'.")
    else:
        print(f"\n[OK] disease_name '{result.disease_name}' does not appear to be a "
              "rice-specific disease.")

except Exception as exc:
    print(f"    [FAIL] {type(exc).__name__}: {exc}")
    import traceback; traceback.print_exc()
    sys.exit(1)
