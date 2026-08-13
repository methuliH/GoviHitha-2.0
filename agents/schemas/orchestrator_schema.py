"""Pydantic output schema for the OrchestratorAgent."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.resource_schema import ResourceResult
from agents.schemas.weather_schema import WeatherResult


class OrchestrationResult(BaseModel):
    situation_summary: str
    diagnosis: DiagnosisResult
    weather: WeatherResult
    resources: ResourceResult
    action_plan: list[str]
    timeline: str
    error: Optional[str] = None
