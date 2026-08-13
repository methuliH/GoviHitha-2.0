"""Test harness for OrchestratorAgent.

Usage:
    python -m agents.tests.test_orchestrator          # mock mode (no API)
    python -m agents.tests.test_orchestrator --live   # full live run
"""
from __future__ import annotations

import base64
import json
import sys
from unittest.mock import MagicMock, patch

from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.orchestrator_schema import OrchestrationResult
from agents.schemas.resource_schema import ProductRecommendation, ResourceResult
from agents.schemas.weather_schema import CurrentWeather, WeatherAlert, WeatherResult

# ---------------------------------------------------------------------------
# Canned results that mock agents will return
# ---------------------------------------------------------------------------
MOCK_DIAGNOSIS = DiagnosisResult(
    disease_name="Rice Leaf Blast",
    confidence=0.92,
    description="Fungal infection caused by Magnaporthe oryzae.",
    treatment_steps=["Apply Tricyclazole fungicide", "Improve field drainage", "Remove infected leaves"],
    timeline="7-10 days with treatment",
    prevention="Use blast-resistant varieties.",
    risk_level="high",
)

MOCK_WEATHER = WeatherResult(
    current_weather=CurrentWeather(temperature=27.8, humidity=82.0, rainfall_7d=86.2),
    alerts=[
        WeatherAlert(
            risk_type="WATERLOGGING",
            likelihood="high",
            days_ahead=2,
            context="Heavy rain will worsen fungal spread.",
            action="Improve drainage immediately and apply fungicide today.",
        )
    ],
    forecast_summary="Heavy rain in 48h. High humidity favours disease spread.",
)

MOCK_RESOURCES = ResourceResult(
    recommendations=[
        ProductRecommendation(
            type="fungicide",
            product_name="Tricyclazole 75% WP",
            why="Directly targets Magnaporthe oryzae.",
            availability="Available at agri-supply shops in Colombo, Kandy.",
            estimated_cost="1200-2500 LKR",
            application_notes="Mix 0.6g per litre. Apply every 7 days.",
            kapruka_search_link="https://www.kapruka.com/search?q=Tricyclazole",
        ),
    ],
    priority_note="Buy fungicide TODAY before the rain arrives in 48h.",
)


def run_mock() -> None:
    print("=" * 60)
    print("MOCK MODE — all agents mocked, no API calls")
    print("=" * 60)

    # 1x1 white JPEG for testing
    minimal_jpeg_b64 = (
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U"
        "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN"
        "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy"
        "MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA"
        "AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA"
        "AAAA/9oADAMBAAIRAxEAPwCwABmX/9k="
    )

    with (
        patch("agents.agents.orchestrator._diagnosis_agent") as mock_diag,
        patch("agents.agents.orchestrator._weather_agent") as mock_weather,
        patch("agents.agents.orchestrator._resource_agent") as mock_resource,
    ):
        mock_diag.diagnose.return_value = MOCK_DIAGNOSIS
        mock_weather.analyse.return_value = MOCK_WEATHER
        mock_resource.recommend.return_value = MOCK_RESOURCES

        from agents.agents.orchestrator import OrchestratorAgent
        agent = OrchestratorAgent()
        result = agent.run(
            crop_type="rice",
            symptoms="Yellowing leaves with brown lesions on edges",
            image_source=minimal_jpeg_b64,
            region="Colombo",
        )

    print(json.dumps(result.model_dump(), indent=2))
    _assert_result(result)
    print("\n[OK] Orchestration mock passed — all fields present and valid")


def _assert_result(result: OrchestrationResult) -> None:
    assert result.situation_summary, "situation_summary must not be empty"
    assert result.diagnosis.disease_name, "diagnosis.disease_name must not be empty"
    assert result.weather.current_weather is not None, "weather.current_weather missing"
    assert isinstance(result.action_plan, list), "action_plan must be a list"
    assert len(result.action_plan) >= 1, "action_plan must have at least one step"
    assert result.timeline, "timeline must not be empty"


def run_live() -> None:
    print("=" * 60)
    print("LIVE MODE — real API calls")
    print("=" * 60)
    import urllib.request

    url = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Riceblight.jpg/320px-Riceblight.jpg"
    print(f"Downloading sample image: {url}")
    with urllib.request.urlopen(url, timeout=15) as resp:  # noqa: S310
        image_b64 = base64.b64encode(resp.read()).decode()

    from agents.agents.orchestrator import OrchestratorAgent
    agent = OrchestratorAgent()
    result = agent.run(
        crop_type="rice",
        symptoms="Brown lesions on leaf edges, yellowing spreading inward",
        image_source=image_b64,
        region="Colombo",
    )
    print(json.dumps(result.model_dump(), indent=2))

    if result.error:
        print(f"\n[FAIL] Error: {result.error}")
    else:
        _assert_result(result)
        print(f"\n[OK] Full orchestration complete")
        print(f"     Disease : {result.diagnosis.disease_name}")
        print(f"     Alerts  : {len(result.weather.alerts)}")
        print(f"     Products: {len(result.resources.recommendations)}")
        print(f"     Plan    : {len(result.action_plan)} steps")


if __name__ == "__main__":
    if "--live" in sys.argv:
        run_live()
    else:
        run_mock()
