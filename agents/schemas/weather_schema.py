"""Pydantic output schemas for the WeatherAlertAgent."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, field_validator


class CurrentWeather(BaseModel):
    temperature: float
    humidity: float
    rainfall_7d: float


class WeatherAlert(BaseModel):
    risk_type: str  # "WATERLOGGING" | "FROST" | "DROUGHT"
    likelihood: str  # "high" | "medium" | "low"
    days_ahead: int
    context: str
    action: str

    @field_validator("likelihood")
    @classmethod
    def validate_likelihood(cls, v: str) -> str:
        if v not in {"high", "medium", "low"}:
            return "medium"
        return v

    @field_validator("days_ahead")
    @classmethod
    def clamp_days(cls, v: int) -> int:
        return max(0, min(7, v))


class WeatherResult(BaseModel):
    current_weather: CurrentWeather
    alerts: list[WeatherAlert]
    forecast_summary: str
    error: Optional[str] = None
