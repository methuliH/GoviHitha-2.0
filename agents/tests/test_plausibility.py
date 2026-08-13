"""Tests for crop/disease plausibility check and CropDiagnosisAgent integration.

Run with:
    python -m pytest agents/tests/test_plausibility.py -v
"""
from __future__ import annotations

import json
from unittest.mock import patch

import pytest

from agents.agents.crop_disease_plausibility import is_plausible
from agents.schemas.diagnosis_schema import DiagnosisResult


# ---------------------------------------------------------------------------
# Unit tests: is_plausible()
# ---------------------------------------------------------------------------

class TestIsPlausible:
    def test_rice_blast_plausible_for_rice(self):
        assert is_plausible("rice", "Rice Leaf Blast") is True

    def test_rice_blast_not_plausible_for_tomato(self):
        """The canonical bug: 'Rice Leaf Blast' should not be plausible for tomato."""
        assert is_plausible("tomato", "Rice Leaf Blast") is False

    def test_tomato_early_blight_plausible_for_tomato(self):
        assert is_plausible("tomato", "Tomato Early Blight") is True

    def test_early_blight_alone_plausible_for_tomato(self):
        assert is_plausible("tomato", "Early Blight") is True

    def test_rice_blast_not_plausible_for_potato(self):
        assert is_plausible("potato", "Rice Leaf Blast") is False

    def test_late_blight_plausible_for_potato(self):
        assert is_plausible("potato", "Potato Late Blight") is True

    def test_chilli_anthracnose_plausible_for_chilli(self):
        assert is_plausible("chilli", "Chilli Anthracnose") is True

    def test_coconut_mite_plausible_for_coconut(self):
        assert is_plausible("coconut", "Coconut Mite Infestation") is True

    def test_coconut_mite_not_plausible_for_rice(self):
        assert is_plausible("rice", "Coconut Mite Infestation") is False

    def test_blister_blight_plausible_for_tea(self):
        assert is_plausible("tea", "Tea Blister Blight") is True

    def test_sigatoka_plausible_for_banana(self):
        assert is_plausible("banana", "Black Sigatoka") is True

    def test_phytophthora_plausible_for_pepper(self):
        assert is_plausible("pepper", "Phytophthora Blight") is True

    def test_cassava_mosaic_plausible_for_cassava(self):
        assert is_plausible("cassava", "Cassava Mosaic Disease") is True

    def test_corn_leaf_blight_plausible_for_corn(self):
        assert is_plausible("corn", "Northern Corn Leaf Blight") is True

    def test_maize_keyword_plausible_for_corn(self):
        assert is_plausible("corn", "Maize Lethal Necrosis") is True

    def test_unable_to_diagnose_always_passes_tomato(self):
        assert is_plausible("tomato", "Unable to Diagnose") is True

    def test_unable_to_diagnose_always_passes_rice(self):
        assert is_plausible("rice", "Unable to Diagnose") is True

    def test_healthy_always_passes(self):
        assert is_plausible("rice", "Healthy") is True
        assert is_plausible("tomato", "Healthy") is True

    def test_case_insensitive_disease_name(self):
        assert is_plausible("rice", "RICE LEAF BLAST") is True
        assert is_plausible("tomato", "RICE LEAF BLAST") is False

    def test_unknown_crop_skips_check(self):
        """A crop with no keyword list should never trigger a mismatch."""
        assert is_plausible("durian", "Durian Root Rot") is True
        assert is_plausible("durian", "Rice Leaf Blast") is True


# ---------------------------------------------------------------------------
# Integration tests: CropDiagnosisAgent sets crop_disease_mismatch_warning
# ---------------------------------------------------------------------------

_RICE_BLAST_JSON = json.dumps({
    "disease_name": "Rice Leaf Blast",
    "confidence": 0.92,
    "description": "Fungal infection caused by Magnaporthe oryzae.",
    "treatment_steps": ["Apply Tricyclazole", "Improve drainage"],
    "timeline": "7–10 days",
    "prevention": "Use resistant varieties.",
    "risk_level": "high",
})

_EARLY_BLIGHT_JSON = json.dumps({
    "disease_name": "Tomato Early Blight",
    "confidence": 0.88,
    "description": "Fungal infection by Alternaria solani.",
    "treatment_steps": ["Remove infected leaves", "Apply Mancozeb"],
    "timeline": "10–14 days",
    "prevention": "Crop rotation and mulching.",
    "risk_level": "high",
})

_UNABLE_JSON = json.dumps({
    "disease_name": "Unable to Diagnose",
    "confidence": 0.1,
    "description": "Image too blurry to confirm.",
    "treatment_steps": [],
    "timeline": "N/A",
    "prevention": "N/A",
    "risk_level": "medium",
})

_DUMMY_IMAGE = b"\xff\xd8\xff"  # minimal JPEG header bytes


class TestCropDiagnosisAgentMismatchWarning:

    def _run_diagnose(self, crop_type: str, gemini_json: str) -> DiagnosisResult:
        from agents.agents.crop_diagnosis import CropDiagnosisAgent
        with (
            patch("agents.agents.crop_diagnosis.load_image",
                  return_value=(_DUMMY_IMAGE, "image/jpeg")),
            patch("agents.agents.crop_diagnosis.call_gemini_vision",
                  return_value=gemini_json),
        ):
            return CropDiagnosisAgent().diagnose(
                crop_type=crop_type,
                symptoms="test symptoms",
                image_source="dummy",
                region="Colombo",
            )

    def test_mismatch_warning_set_when_rice_blast_diagnosed_for_tomato(self):
        """Core regression test: the original bug scenario must trigger the flag."""
        result = self._run_diagnose("tomato", _RICE_BLAST_JSON)
        assert result.disease_name == "Rice Leaf Blast"
        assert result.crop_disease_mismatch_warning is True
        assert result.error is None

    def test_no_warning_when_rice_blast_diagnosed_for_rice(self):
        """Same disease, correct crop — no warning should be set."""
        result = self._run_diagnose("rice", _RICE_BLAST_JSON)
        assert result.disease_name == "Rice Leaf Blast"
        assert result.crop_disease_mismatch_warning is False
        assert result.error is None

    def test_no_warning_when_early_blight_diagnosed_for_tomato(self):
        result = self._run_diagnose("tomato", _EARLY_BLIGHT_JSON)
        assert result.disease_name == "Tomato Early Blight"
        assert result.crop_disease_mismatch_warning is False
        assert result.error is None

    def test_unable_to_diagnose_never_triggers_warning(self):
        result = self._run_diagnose("tomato", _UNABLE_JSON)
        assert result.crop_disease_mismatch_warning is False
        assert result.error is None

    def test_warning_does_not_suppress_result(self):
        """When the flag is set, the result must still contain the full diagnosis."""
        result = self._run_diagnose("tomato", _RICE_BLAST_JSON)
        assert result.disease_name == "Rice Leaf Blast"
        assert result.confidence == 0.92
        assert result.risk_level == "high"
        assert len(result.treatment_steps) == 2
