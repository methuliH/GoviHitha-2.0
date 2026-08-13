"""Test harness for WeatherAlertAgent.

Usage:
    # Mock mode (no API key, no network):
    python -m agents.tests.test_weather_alert

    # Live weather only (real OpenMeteo, no Gemini key needed):
    python -m agents.tests.test_weather_alert --weather

    # Full live mode (real OpenMeteo + real Gemini):
    python -m agents.tests.test_weather_alert --live
"""
from __future__ import annotations

import json
import sys

from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.weather_schema import CurrentWeather, WeatherAlert, WeatherResult


# ---------------------------------------------------------------------------
# Sample diagnosis (matches what CropDiagnosisAgent would produce)
# ---------------------------------------------------------------------------
SAMPLE_DIAGNOSIS = DiagnosisResult(
    disease_name="Rice Leaf Blast",
    confidence=0.92,
    description="Fungal infection caused by Magnaporthe oryzae, common in humid rice-growing regions.",
    treatment_steps=["Apply Tricyclazole fungicide", "Improve field drainage"],
    timeline="7-10 days with treatment",
    prevention="Use blast-resistant varieties, avoid excess nitrogen.",
    risk_level="high",
)

SAMPLE_REGIONS = [
    ("Colombo", "rice"),
    ("Nuwara Eliya", "tea"),
]


def _mock_result() -> WeatherResult:
    return WeatherResult(
        current_weather=CurrentWeather(temperature=28.5, humidity=82.0, rainfall_7d=67.3),
        alerts=[
            WeatherAlert(
                risk_type="WATERLOGGING",
                likelihood="high",
                days_ahead=2,
                context="Heavy rain forecast will accelerate fungal spread of Rice Leaf Blast in waterlogged paddy fields.",
                action="Improve field drainage immediately and apply Tricyclazole before rain arrives.",
            ),
            WeatherAlert(
                risk_type="HIGH_HUMIDITY",
                likelihood="medium",
                days_ahead=0,
                context="Current humidity of 82% is above the 80% threshold that accelerates Magnaporthe oryzae spore germination.",
                action="Monitor field closely and consider preventive fungicide application.",
            ),
        ],
        forecast_summary="High humidity and incoming rain create high-risk conditions for Rice Leaf Blast. Urgent drainage action needed.",
    )


def run_mock() -> None:
    print("=" * 60)
    print("MOCK MODE — no API or network calls made")
    print("=" * 60)
    result = _mock_result()
    print(json.dumps(result.model_dump(), indent=2))
    print("\n[OK] Mock WeatherResult validated successfully")


def run_weather_only() -> None:
    print("=" * 60)
    print("WEATHER-ONLY MODE — real OpenMeteo, no Gemini")
    print("=" * 60)
    from agents.tools.openmeteo_weather import fetch_weather
    from agents.config.constants import REGION_COORDINATES

    for region, crop in SAMPLE_REGIONS:
        lat, lon = REGION_COORDINATES[region]
        print(f"\n[{region}] ({lat}, {lon})")
        try:
            data = fetch_weather(lat, lon)
            print(f"  Temperature : {data['current_temperature']}°C")
            print(f"  Humidity    : {data['current_humidity']}%")
            print(f"  Rainfall 7d : {data['rainfall_7d']} mm")
            print(f"  Daily precip: {data['daily_precipitation']}")
            print("  [OK] OpenMeteo fetch succeeded")
        except Exception as exc:
            print(f"  [FAIL] {exc}")


def run_live() -> None:
    print("=" * 60)
    print("LIVE MODE — real OpenMeteo + real Gemini API")
    print("=" * 60)
    from agents.agents.weather_alert import WeatherAlertAgent

    agent = WeatherAlertAgent()
    all_passed = True

    for region, crop in SAMPLE_REGIONS:
        print(f"\nRegion: {region}  Crop: {crop}")
        print(f"Disease: {SAMPLE_DIAGNOSIS.disease_name}")
        result = agent.analyse(
            region=region,
            crop_type=crop,
            diagnosis=SAMPLE_DIAGNOSIS,
        )
        print(json.dumps(result.model_dump(), indent=2))
        if result.error:
            print(f"  [FAIL] Error: {result.error}")
            all_passed = False
        else:
            print(f"  [OK] {len(result.alerts)} alert(s) — {result.forecast_summary[:60]}")

    print("\n" + ("[OK] All tests passed" if all_passed else "[FAIL] Some tests failed"))


def run_bad_region() -> None:
    print("\n[Error handling test] Unknown region")
    from agents.agents.weather_alert import WeatherAlertAgent
    result = WeatherAlertAgent().analyse(
        region="UnknownPlace",
        crop_type="rice",
        diagnosis=SAMPLE_DIAGNOSIS,
    )
    # Should not raise — should use fallback coordinates
    assert result.current_weather is not None, "Expected current_weather to be set"
    print("  [OK] Unknown region handled gracefully (used fallback coords)")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--live" in args:
        run_live()
        run_bad_region()
    elif "--weather" in args:
        run_weather_only()
        run_bad_region()
    else:
        run_mock()
        run_bad_region()
