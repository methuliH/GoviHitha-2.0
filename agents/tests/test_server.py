"""Smoke tests for the FastAPI server layer.

Uses FastAPI's TestClient so no real HTTP port is opened.
Mocks the OrchestratorAgent so no Gemini calls are made.

Run:
    python -m pytest agents/tests/test_server.py -v
"""
from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.market_price_schema import MarketPriceResult
from agents.schemas.orchestrator_schema import OrchestrationResult
from agents.schemas.planting_schema import PlantingAdvice, VarietyRecommendation
from agents.schemas.resource_schema import ProductRecommendation, ResourceResult
from agents.schemas.weather_schema import CurrentWeather, WeatherAlert, WeatherResult

# ---------------------------------------------------------------------------
# Shared mock result
# ---------------------------------------------------------------------------

MOCK_RESULT = OrchestrationResult(
    situation_summary="Your rice crop in Colombo has been diagnosed with Rice Leaf Blast.",
    diagnosis=DiagnosisResult(
        disease_name="Rice Leaf Blast",
        confidence=0.92,
        description="Fungal infection caused by Magnaporthe oryzae.",
        treatment_steps=["Apply Tricyclazole fungicide", "Improve field drainage"],
        timeline="7-10 days",
        prevention="Use blast-resistant varieties.",
        risk_level="high",
    ),
    weather=WeatherResult(
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
        forecast_summary="High humidity and rain — urgent drainage action needed.",
    ),
    resources=ResourceResult(
        recommendations=[
            ProductRecommendation(
                type="fungicide",
                product_name="Tricyclazole 75% WP",
                why="Directly targets Magnaporthe oryzae.",
                availability="Agri-supply shops in Colombo.",
                estimated_cost="1200-2500 LKR",
                kapruka_search_link="https://www.kapruka.com/search?q=Tricyclazole",
            )
        ],
        priority_note="Buy Tricyclazole TODAY.",
    ),
    action_plan=["Buy Tricyclazole today", "Apply fungicide", "Improve drainage"],
    timeline="7-10 days",
)

MOCK_ADVICE = PlantingAdvice(
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

MOCK_PRICE = MarketPriceResult(
    crop_type="rice",
    unit="per kg (paddy)",
    todays_price_lkr=108.5,
    avg_price_30d_lkr=100.0,
    price_change_pct=8.5,
    trend="up",
    advisory="Prices are 8% above the recent average for rice -- a good time to sell if you have stock ready.",
    last_updated="2026-08-13",
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """TestClient with OrchestratorAgent and PlantingAdvisorAgent mocked out.

    We patch the classes (not the module-level variables) because the lifespan
    handler creates new instances on startup, overwriting any direct patch.
    """
    mock_orch = MagicMock()
    mock_orch.run.return_value = MOCK_RESULT

    mock_advisor = MagicMock()
    mock_advisor.advise.return_value = MOCK_ADVICE

    mock_price_agent = MagicMock()
    mock_price_agent.check_price.return_value = MOCK_PRICE

    import agents.server as server_module
    # Patch the names as bound in agents.server (via `from ... import X`)
    with patch("agents.server.OrchestratorAgent", return_value=mock_orch), \
         patch("agents.server.PlantingAdvisorAgent", return_value=mock_advisor), \
         patch("agents.server.MarketPriceAgent", return_value=mock_price_agent):
        with TestClient(server_module.app, raise_server_exceptions=False) as c:
            yield c, mock_orch, mock_advisor, mock_price_agent


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_health(client):
    c, _, _, _ = client
    r = c.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_run_returns_orchestration_result(client):
    c, mock_orch, _, _ = client
    payload = {
        "crop_type": "rice",
        "symptoms": "yellowing leaves with dark brown spots",
        "image_base64": "data:image/jpeg;base64,/9j/4AAQ",
        "region": "Colombo",
    }
    r = c.post("/run", json=payload)
    assert r.status_code == 200

    body = r.json()
    assert body["diagnosis"]["disease_name"] == "Rice Leaf Blast"
    assert body["diagnosis"]["confidence"] == 0.92
    assert body["weather"]["alerts"][0]["risk_type"] == "WATERLOGGING"
    assert len(body["resources"]["recommendations"]) == 1
    assert body["action_plan"][0] == "Buy Tricyclazole today"

    mock_orch.run.assert_called_once_with(
        crop_type="rice",
        symptoms="yellowing leaves with dark brown spots",
        image_source="data:image/jpeg;base64,/9j/4AAQ",
        region="Colombo",
    )


def test_run_missing_field(client):
    c, _, _, _ = client
    r = c.post("/run", json={"crop_type": "rice", "symptoms": "spots"})
    assert r.status_code == 422  # FastAPI validation error


def test_run_wrong_method(client):
    c, _, _, _ = client
    r = c.get("/run")
    assert r.status_code == 405


def test_openapi_docs_available(client):
    c, _, _, _ = client
    r = c.get("/docs")
    assert r.status_code == 200


def test_advise_returns_planting_advice(client):
    c, _, mock_advisor, _ = client
    payload = {"crop_type": "rice", "region": "Anuradhapura"}
    r = c.post("/advise", json=payload)
    assert r.status_code == 200

    body = r.json()
    assert body["recommended_variety"]["variety_name"] == "Bg 300"
    assert body["season"] == "Yala"
    assert body["sowing_window_label"] == "22 Aug - 5 Sep"

    mock_advisor.advise.assert_called_once_with(crop_type="rice", region="Anuradhapura")


def test_advise_missing_field(client):
    c, _, _, _ = client
    r = c.post("/advise", json={"crop_type": "rice"})
    assert r.status_code == 422  # FastAPI validation error


def test_advise_wrong_method(client):
    c, _, _, _ = client
    r = c.get("/advise")
    assert r.status_code == 405


def test_market_price_returns_result(client):
    c, _, _, mock_price_agent = client
    r = c.post("/market-price", json={"crop_type": "rice"})
    assert r.status_code == 200

    body = r.json()
    assert body["crop_type"] == "rice"
    assert body["trend"] == "up"
    assert body["todays_price_lkr"] == 108.5

    mock_price_agent.check_price.assert_called_once_with(crop_type="rice")


def test_market_price_missing_field(client):
    c, _, _, _ = client
    r = c.post("/market-price", json={})
    assert r.status_code == 422  # FastAPI validation error


def test_market_price_wrong_method(client):
    c, _, _, _ = client
    r = c.get("/market-price")
    assert r.status_code == 405


if __name__ == "__main__":
    import subprocess, sys
    subprocess.run([sys.executable, "-m", "pytest", __file__, "-v"])
