"""
Govi Hitha — ADK Connection & CropDiagnosisAgent Verification Test
=====================================================================

Run this from your `agents/` directory:

    python test_adk_connection.py

What it checks, in order (each step must pass before the next runs):

  1. ADK is installed and importable
  2. GOOGLE_API_KEY is set and can make a minimal live call
  3. CropDiagnosisAgent + DiagnosisResult can be imported from your codebase
  4. The agent can be instantiated
  5. The agent produces a structurally valid, plausible diagnosis on a
     real test image (not just "no exception raised")
  6. Error handling works (garbage image input doesn't crash the agent)

Exit code is 0 only if every step passes — useful for wiring into CI later.

Adapted from the original harness to match real project structure:
  - agents/ root (not backend/)
  - schemas.diagnosis_schema.DiagnosisResult (not schemas.diagnosis)
  - diagnose(crop_type, symptoms, image_source, region) signature
  - treatment_steps field (not recommended_actions)
  - google.genai SDK (not google.generativeai)
"""

import os
import sys
import time
import traceback
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Small test-report helper
# ---------------------------------------------------------------------------

class Report:
    def __init__(self):
        self.results = []  # (step_name, passed, detail)

    def record(self, step, passed, detail=""):
        self.results.append((step, passed, detail))
        icon = "OK" if passed else "FAIL"
        print(f"[{icon}] {step}" + (f" -- {detail}" if detail else ""))

    def summary(self):
        print("\n" + "=" * 60)
        passed = sum(1 for _, p, _ in self.results if p)
        total = len(self.results)
        print(f"RESULT: {passed}/{total} checks passed")
        print("=" * 60)
        return passed == total


report = Report()

# ---------------------------------------------------------------------------
# Step 1 — ADK importable
# ---------------------------------------------------------------------------

print("\n[1/6] Checking Google ADK installation...")
try:
    import google.adk  # noqa: F401
    from google.adk.agents import Agent  # noqa: F401
    report.record("ADK import", True, "import succeeded")
except ImportError as e:
    report.record("ADK import", False, str(e))
    print("\n>> Fix: pip install google-adk")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 2 — API key present + live round trip works
# ---------------------------------------------------------------------------

print("\n[2/6] Checking GOOGLE_API_KEY and live API connectivity...")

# Load .env from repo root (two levels up from agents/)
_env_path = Path(__file__).resolve().parents[1] / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path)

api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    report.record("GOOGLE_API_KEY set", False, "environment variable not found")
    print("\n>> Fix: export GOOGLE_API_KEY=your_key_here  (or add it to .env)")
    sys.exit(1)
report.record("GOOGLE_API_KEY set", True, f"found (length {len(api_key)})")

try:
    from google import genai as _genai
    _client = _genai.Client(api_key=api_key)
    start = time.time()
    resp = _client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Reply with exactly one word: OK",
    )
    elapsed = time.time() - start
    text = (resp.text or "").strip()
    if "OK" in text.upper():
        report.record("Live Gemini round trip", True, f"{elapsed:.2f}s, response: {text!r}")
    else:
        report.record("Live Gemini round trip", False, f"unexpected response: {text!r}")
except Exception as e:
    report.record("Live Gemini round trip", False, f"{type(e).__name__}: {e}")
    print("\n>> This usually means: invalid API key, no quota, or network/firewall issue.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 3 — Your agent code imports cleanly
# ---------------------------------------------------------------------------

print("\n[3/6] Importing CropDiagnosisAgent and DiagnosisResult from your codebase...")
try:
    sys.path.insert(0, str(Path(__file__).parent))
    from agents.crop_diagnosis import CropDiagnosisAgent
    from schemas.diagnosis_schema import DiagnosisResult
    report.record("Import CropDiagnosisAgent + DiagnosisResult", True)
except Exception as e:
    report.record("Import CropDiagnosisAgent + DiagnosisResult", False, f"{type(e).__name__}: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    print("\n>> Check that agents/crop_diagnosis.py and schemas/diagnosis_schema.py exist")
    print("   and that you're running this script from the agents/ directory.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 4 — Agent instantiates
# ---------------------------------------------------------------------------

print("\n[4/6] Instantiating CropDiagnosisAgent...")
try:
    agent = CropDiagnosisAgent()
    report.record("Agent instantiation", True)
except Exception as e:
    report.record("Agent instantiation", False, f"{type(e).__name__}: {e}")
    traceback.print_exc()
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 5 — Real diagnosis on a real image, validated against schema
# ---------------------------------------------------------------------------

print("\n[5/6] Running a real diagnosis and validating the output...")

# A well-known, clearly diseased leaf image (tomato early blight) from the
# PlantVillage dataset mirror — good for a sanity check since the disease
# is visually obvious.
TEST_IMAGE_URL = (
    "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/"
    "master/raw/color/Tomato___Early_blight/0022d6b7-d47c-4ee2-ae9a-392a53f48647___RS_Erly.B%208461.JPG"
)
TEST_IMAGE_PATH = Path("test_leaf_sample.jpg")

try:
    if not TEST_IMAGE_PATH.exists():
        urllib.request.urlretrieve(TEST_IMAGE_URL, TEST_IMAGE_PATH)
    image_ok = TEST_IMAGE_PATH.exists() and TEST_IMAGE_PATH.stat().st_size > 1000
    report.record("Download test image", image_ok, str(TEST_IMAGE_PATH))
except Exception as e:
    report.record("Download test image", False, f"{type(e).__name__}: {e}")
    print(">> No internet access to GitHub raw content, or URL changed.")
    print("   Swap TEST_IMAGE_PATH for a local image of a diseased leaf and re-run.")
    image_ok = False

if image_ok:
    try:
        start = time.time()
        result = agent.diagnose(
            crop_type="tomato",
            symptoms="Brown spots with concentric rings on lower leaves, yellowing around spots",
            image_source=str(TEST_IMAGE_PATH),
            region="Nuwara Eliya",
        )
        elapsed = time.time() - start

        # --- Structural validation ---
        checks = []
        checks.append(("Returned a DiagnosisResult", isinstance(result, DiagnosisResult)))
        checks.append(("disease_name is non-empty string",
                        isinstance(result.disease_name, str) and len(result.disease_name.strip()) > 0))
        checks.append(("confidence is float in [0.0, 1.0]",
                        isinstance(result.confidence, (int, float)) and 0.0 <= result.confidence <= 1.0))
        checks.append(("description is non-empty string",
                        isinstance(result.description, str) and len(result.description.strip()) > 0))
        checks.append(("treatment_steps is a non-empty list",
                        isinstance(result.treatment_steps, list) and len(result.treatment_steps) > 0))
        checks.append(("risk_level in {low, medium, high}",
                        result.risk_level in ("low", "medium", "high")))
        checks.append(("no unexpected error field set", result.error is None))
        checks.append(("responded within timeout (30s)", elapsed < 30))

        all_passed = True
        for name, passed in checks:
            report.record(f"  . {name}", passed)
            all_passed = all_passed and passed

        print(f"\n  Raw result ({elapsed:.2f}s):")
        print(f"    disease_name:     {result.disease_name}")
        print(f"    confidence:       {result.confidence}")
        print(f"    risk_level:       {result.risk_level}")
        print(f"    description:      {result.description[:120]}...")
        print(f"    treatment_steps:  {result.treatment_steps}")

        # Loose accuracy signal — not a strict pass/fail, just informative,
        # since the model isn't guaranteed to name it exactly "early blight".
        disease_lower = result.disease_name.lower()
        plausible_hit = any(kw in disease_lower for kw in ["blight", "leaf spot", "fungal", "alternaria"])
        report.record(
            "Diagnosis plausible for known early-blight sample (informational only)",
            plausible_hit,
            f"got '{result.disease_name}' -- mismatch doesn't necessarily mean the agent is broken",
        )

        report.record("Diagnosis on real image", all_passed)
    except Exception as e:
        report.record("Diagnosis on real image", False, f"{type(e).__name__}: {e}")
        traceback.print_exc()

# ---------------------------------------------------------------------------
# Step 6 — Error handling: malformed input shouldn't crash the agent
# ---------------------------------------------------------------------------

print("\n[6/6] Checking error handling on malformed input...")
try:
    bad_path = "this_file_does_not_exist_12345.jpg"
    result = agent.diagnose(
        crop_type="rice",
        symptoms="test",
        image_source=bad_path,
        region="Colombo",
    )
    handled_gracefully = isinstance(result, DiagnosisResult) and result.error is not None
    report.record(
        "Malformed input handled without raising",
        handled_gracefully,
        f"error field: {getattr(result, 'error', None)!r}",
    )
except Exception as e:
    report.record(
        "Malformed input handled without raising",
        False,
        f"agent raised {type(e).__name__} instead of returning an error result: {e}",
    )

# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------

all_good = report.summary()
sys.exit(0 if all_good else 1)
