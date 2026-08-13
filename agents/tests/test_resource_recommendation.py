"""Test harness for ResourceRecommendationAgent.

Usage:
    python -m agents.tests.test_resource_recommendation          # mock mode
    python -m agents.tests.test_resource_recommendation --live   # real Gemini
"""
from __future__ import annotations

import json
import sys

from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.resource_schema import ProductRecommendation, ResourceResult
from agents.schemas.weather_schema import CurrentWeather, WeatherAlert, WeatherResult

SAMPLE_DIAGNOSIS = DiagnosisResult(
    disease_name="Rice Leaf Blast",
    confidence=0.92,
    description="Fungal infection caused by Magnaporthe oryzae.",
    treatment_steps=["Apply Tricyclazole fungicide", "Improve field drainage", "Remove infected leaves"],
    timeline="7-10 days with treatment",
    prevention="Use blast-resistant varieties.",
    risk_level="high",
)

SAMPLE_WEATHER = WeatherResult(
    current_weather=CurrentWeather(temperature=27.8, humidity=82.0, rainfall_7d=86.2),
    alerts=[
        WeatherAlert(
            risk_type="WATERLOGGING",
            likelihood="high",
            days_ahead=2,
            context="Heavy rain will worsen fungal spread.",
            action="Improve drainage immediately.",
        )
    ],
    forecast_summary="Heavy rain in 48h. High humidity favours disease spread.",
)


def _mock_result() -> ResourceResult:
    return ResourceResult(
        recommendations=[
            ProductRecommendation(
                type="fungicide",
                product_name="Tricyclazole 75% WP",
                why="Directly targets Magnaporthe oryzae causing Rice Leaf Blast.",
                availability="Available at agri-supply shops in Colombo, Kandy, Galle.",
                estimated_cost="1200-2500 LKR per 100g packet",
                application_notes="Mix 0.6g per litre. Apply every 7 days for 3 weeks.",
                kapruka_search_link="https://www.kapruka.com/search?q=Tricyclazole",
            ),
            ProductRecommendation(
                type="tool",
                product_name="Field drainage shovel",
                why="Address waterlogging risk before heavy rain in 48h.",
                availability="Hardware shops islandwide.",
                estimated_cost="800-1500 LKR",
                application_notes="Dig drainage channels along field borders.",
                kapruka_search_link="https://www.kapruka.com/search?q=drainage+shovel",
            ),
        ],
        priority_note="Buy Tricyclazole TODAY and apply before rain. Drainage work must start immediately.",
    )


def run_mock() -> None:
    print("=" * 60)
    print("MOCK MODE — no API calls made")
    print("=" * 60)
    result = _mock_result()
    print(json.dumps(result.model_dump(), indent=2))
    print("\n[OK] Mock ResourceResult validated successfully")


def run_live() -> None:
    print("=" * 60)
    print("LIVE MODE — real Gemini API")
    print("=" * 60)
    from agents.agents.resource_recommendation import ResourceRecommendationAgent
    agent = ResourceRecommendationAgent()
    result = agent.recommend(
        crop_type="rice",
        diagnosis=SAMPLE_DIAGNOSIS,
        weather=SAMPLE_WEATHER,
        region="Colombo",
    )
    print(json.dumps(result.model_dump(), indent=2))
    if result.error:
        print(f"\n[FAIL] Error: {result.error}")
    else:
        print(f"\n[OK] {len(result.recommendations)} recommendation(s)")


def run_kapruka_links() -> None:
    print("\n[Kapruka link test]")
    from agents.tools.kapruka_search import kapruka_link
    products = ["Tricyclazole 75% WP", "Mancozeb fungicide", "drainage pipe"]
    for p in products:
        link = kapruka_link(p)
        assert "kapruka.com/search?q=" in link
        print(f"  {p} -> {link}")
    print("  [OK] All Kapruka links generated correctly")


if __name__ == "__main__":
    if "--live" in sys.argv:
        run_live()
    else:
        run_mock()
    run_kapruka_links()
