"""Tests for Hayleys Agriculture disease-to-product lookup.

Run:
    python -m pytest agents/tests/test_hayleys_lookup.py -v
"""
from __future__ import annotations

import pytest

from agents.data import hayleys_disease_map as hayleys
from agents.data.hayleys_disease_map import lookup
from agents.agents.resource_recommendation import ResourceRecommendationAgent
from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.weather_schema import CurrentWeather, WeatherResult


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _diag(disease: str, risk: str = "high") -> DiagnosisResult:
    return DiagnosisResult(
        disease_name=disease,
        confidence=0.9,
        description="test",
        treatment_steps=[],
        timeline="14 days",
        prevention="test",
        risk_level=risk,
    )


def _weather_no_alerts() -> WeatherResult:
    return WeatherResult(
        current_weather=CurrentWeather(temperature=27.0, humidity=80.0, rainfall_7d=50.0),
        alerts=[],
        forecast_summary="No alerts.",
    )


# ---------------------------------------------------------------------------
# lookup() unit tests
# ---------------------------------------------------------------------------

class TestLookup:
    def test_rice_blast_returns_folicur(self):
        results = lookup("rice", "Rice Leaf Blast")
        ids = [r["id"] for r in results]
        assert "folicur-tebuconazole" in ids

    def test_rice_sheath_blight_returns_hexaconazole(self):
        results = lookup("rice", "Sheath Blight")
        ids = [r["id"] for r in results]
        assert "hayleys-hexaconazole" in ids

    def test_tomato_early_blight_returns_mancozeb(self):
        results = lookup("tomato", "Tomato Early Blight")
        ids = [r["id"] for r in results]
        assert "hayleys-mancozeb" in ids

    def test_potato_late_blight_returns_fluazinam(self):
        results = lookup("potato", "Potato Late Blight")
        ids = [r["id"] for r in results]
        assert "nando-fluazinam" in ids

    def test_chilli_anthracnose_returns_nativo(self):
        results = lookup("chilli", "Chilli Anthracnose")
        ids = [r["id"] for r in results]
        assert "nativo-75-wg" in ids

    def test_tea_blister_blight_returns_hexaconazole(self):
        results = lookup("tea", "Tea Blister Blight")
        ids = [r["id"] for r in results]
        assert "hayleys-hexaconazole" in ids

    def test_banana_sigatoka_returns_folicur(self):
        results = lookup("banana", "Black Sigatoka")
        ids = [r["id"] for r in results]
        assert "folicur-tebuconazole" in ids

    def test_cassava_mosaic_returns_imidacloprid(self):
        results = lookup("cassava", "Cassava Mosaic Disease")
        ids = [r["id"] for r in results]
        assert "admire-imidacloprid" in ids

    def test_results_capped_at_two(self):
        # Rice sheath blight has 2 matching products — must not exceed 2
        results = lookup("rice", "Rice Sheath Blight")
        assert len(results) <= 2

    def test_each_result_has_why(self):
        results = lookup("rice", "Rice Leaf Blast")
        assert all("why" in r and r["why"] for r in results)

    def test_each_result_has_hayleys_url(self):
        results = lookup("rice", "Rice Leaf Blast")
        for r in results:
            assert r.get("url", "").startswith("https://www.hayleysagriculture.com")

    # ── No-match cases ──────────────────────────────────────────────────

    def test_unable_to_diagnose_returns_empty(self):
        assert lookup("rice", "Unable to Diagnose") == []

    def test_coconut_mite_no_match(self):
        # No Hayleys product explicitly covers coconut mite infestation
        results = lookup("coconut", "Coconut Mite Infestation")
        assert results == []

    def test_corn_leaf_blight_no_match(self):
        results = lookup("corn", "Northern Corn Leaf Blight")
        assert results == []

    def test_pepper_phytophthora_no_match(self):
        # Nando Fluazinam covers potato Phytophthora, not pepper Phytophthora capsici
        results = lookup("pepper", "Pepper Phytophthora Blight")
        assert results == []

    def test_empty_disease_returns_empty(self):
        assert lookup("rice", "") == []

    def test_unknown_disease_returns_empty(self):
        assert lookup("rice", "Unknown Disease XYZ") == []


# ---------------------------------------------------------------------------
# ResourceRecommendationAgent integration tests
# ---------------------------------------------------------------------------

class TestResourceRecommendationAgent:
    def setup_method(self):
        self.agent = ResourceRecommendationAgent()
        self.weather = _weather_no_alerts()

    def test_known_disease_returns_recommendations(self):
        result = self.agent.recommend("rice", _diag("Rice Leaf Blast"), self.weather, "Kandy")
        assert len(result.recommendations) >= 1
        assert result.error is None

    def test_known_disease_has_hayleys_url(self):
        result = self.agent.recommend("rice", _diag("Rice Leaf Blast"), self.weather, "Kandy")
        rec = result.recommendations[0]
        assert rec.hayleys_product_url.startswith("https://www.hayleysagriculture.com")
        assert rec.dealer_url == hayleys.DEALER_URL

    def test_known_disease_has_active_ingredient(self):
        result = self.agent.recommend("rice", _diag("Rice Leaf Blast"), self.weather, "Kandy")
        rec = result.recommendations[0]
        assert rec.active_ingredient  # non-empty

    def test_no_match_returns_empty_recommendations(self):
        result = self.agent.recommend("coconut", _diag("Coconut Mite Infestation"), self.weather, "Galle")
        assert result.recommendations == []
        assert result.error is None  # explicit no-match, not an error
        assert "No specific Hayleys" in result.priority_note

    def test_unable_to_diagnose_returns_no_match(self):
        result = self.agent.recommend("rice", _diag("Unable to Diagnose"), self.weather, "Kandy")
        assert result.recommendations == []
        assert result.error is None

    def test_never_raises(self):
        # ResourceRecommendationAgent must always return, never raise
        result = self.agent.recommend("corn", _diag(""), self.weather, "Colombo")
        assert isinstance(result.recommendations, list)
