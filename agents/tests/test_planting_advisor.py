"""Test harness for PlantingAdvisorAgent.

Usage:
    # Mock mode (no API key, no network):
    python -m agents.tests.test_planting_advisor

    # Forecast only (real OpenMeteo, no Gemini key needed):
    python -m agents.tests.test_planting_advisor --forecast

    # Full live mode (real OpenMeteo + real Gemini):
    python -m agents.tests.test_planting_advisor --live
"""
from __future__ import annotations

import json
import sys

from agents.schemas.planting_schema import PlantingAdvice, VarietyRecommendation

SAMPLE_REGIONS = [
    ("Anuradhapura", "rice"),
    ("Nuwara Eliya", "tea"),
]


def _mock_result() -> PlantingAdvice:
    return PlantingAdvice(
        crop_type="rice",
        region="Anuradhapura",
        recommended_variety=VarietyRecommendation(
            variety_name="Bg 300",
            reason="Short-duration and drought-tolerant, well suited to this dry-zone district.",
            days_to_maturity=105,
        ),
        sowing_window_label="22 Aug - 5 Sep",
        sowing_window_start="2026-08-22",
        sowing_window_end="2026-09-05",
        season="Yala",
        risk_notes=["Dry spell forecast in the first week -- irrigate at sowing if possible."],
        confidence="medium",
        advisory_summary="Bg 300 fits this dry-zone district well given the current forecast.",
    )


def run_mock() -> None:
    print("=" * 60)
    print("MOCK MODE — no API or network calls made")
    print("=" * 60)
    result = _mock_result()
    print(json.dumps(result.model_dump(), indent=2))
    print("\n[OK] Mock PlantingAdvice validated successfully")


def run_forecast_only() -> None:
    print("=" * 60)
    print("FORECAST-ONLY MODE — real OpenMeteo, no Gemini")
    print("=" * 60)
    from agents.tools.openmeteo_weather import fetch_forecast
    from agents.config.constants import REGION_COORDINATES

    for region, crop in SAMPLE_REGIONS:
        lat, lon = REGION_COORDINATES[region]
        print(f"\n[{region}] ({lat}, {lon})")
        try:
            data = fetch_forecast(lat, lon, days=16)
            print(f"  Days returned: {len(data['days'])}")
            print(f"  First day: {data['days'][0]}")
            print("  [OK] OpenMeteo forecast fetch succeeded")
        except Exception as exc:
            print(f"  [FAIL] {exc}")


def run_live() -> None:
    print("=" * 60)
    print("LIVE MODE — real OpenMeteo + real Gemini API")
    print("=" * 60)
    from agents.agents.planting_advisor import PlantingAdvisorAgent

    agent = PlantingAdvisorAgent()
    all_passed = True

    for region, crop in SAMPLE_REGIONS:
        print(f"\nRegion: {region}  Crop: {crop}")
        result = agent.advise(crop_type=crop, region=region)
        print(json.dumps(result.model_dump(), indent=2))
        if result.error:
            print(f"  [FAIL] Error: {result.error}")
            all_passed = False
        else:
            print(f"  [OK] {result.recommended_variety.variety_name} — {result.sowing_window_label}")

    print("\n" + ("[OK] All tests passed" if all_passed else "[FAIL] Some tests failed"))


def run_unknown_crop() -> None:
    print("\n[Error handling test] Unknown crop")
    from agents.agents.planting_advisor import PlantingAdvisorAgent
    result = PlantingAdvisorAgent().advise(crop_type="dragonfruit", region="Kandy")
    assert result.error is not None, "Expected an error for an unrecognised crop"
    print("  [OK] Unknown crop handled gracefully")


def run_bad_region() -> None:
    print("\n[Error handling test] Unknown region")
    from agents.agents.planting_advisor import PlantingAdvisorAgent
    result = PlantingAdvisorAgent().advise(crop_type="rice", region="UnknownPlace")
    # Should not raise — should use fallback coordinates
    assert result.recommended_variety is not None, "Expected recommended_variety to be set"
    print("  [OK] Unknown region handled gracefully (used fallback coords)")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--live" in args:
        run_live()
        run_bad_region()
    elif "--forecast" in args:
        run_forecast_only()
        run_bad_region()
    else:
        run_mock()
        run_unknown_crop()
