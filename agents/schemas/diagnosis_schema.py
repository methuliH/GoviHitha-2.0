"""Pydantic output schema for the CropDiagnosisAgent."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, field_validator


class DiagnosisResult(BaseModel):
    disease_name: str
    confidence: float
    description: str
    treatment_steps: list[str]
    timeline: str
    prevention: str
    risk_level: str = "medium"
    error: Optional[str] = None
    # Set to True when the diagnosed disease is not in the known-plausible list
    # for the submitted crop. This is a heuristic signal, not a hard error.
    crop_disease_mismatch_warning: bool = False

    @field_validator("confidence")
    @classmethod
    def clamp_confidence(cls, v: float) -> float:
        return max(0.0, min(1.0, v))

    @field_validator("risk_level")
    @classmethod
    def validate_risk_level(cls, v: str) -> str:
        if v not in {"low", "medium", "high"}:
            return "medium"
        return v
