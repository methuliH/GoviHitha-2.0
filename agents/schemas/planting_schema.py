"""Pydantic output schemas for the PlantingAdvisorAgent."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, field_validator


class VarietyRecommendation(BaseModel):
    variety_name: str
    reason: str
    days_to_maturity: int


class PlantingAdvice(BaseModel):
    crop_type: str
    region: str
    recommended_variety: VarietyRecommendation
    sowing_window_label: str  # e.g. "22 Aug - 5 Sep"
    sowing_window_start: str  # ISO date, e.g. "2026-08-22"
    sowing_window_end: str  # ISO date, e.g. "2026-09-05"
    season: str  # "Yala" | "Maha"
    risk_notes: list[str]
    confidence: str = "medium"  # "high" | "medium" | "low"
    advisory_summary: str
    error: Optional[str] = None

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: str) -> str:
        if v not in {"high", "medium", "low"}:
            return "medium"
        return v

    @field_validator("season")
    @classmethod
    def validate_season(cls, v: str) -> str:
        if v not in {"Yala", "Maha"}:
            return "Yala"
        return v
