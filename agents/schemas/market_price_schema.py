"""Pydantic output schema for the MarketPriceAgent."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, field_validator


class MarketPriceResult(BaseModel):
    crop_type: str
    unit: str
    todays_price_lkr: float
    avg_price_30d_lkr: float
    price_change_pct: float
    trend: str = "stable"  # "up" | "down" | "stable"
    advisory: str
    last_updated: str  # ISO date
    error: Optional[str] = None

    @field_validator("trend")
    @classmethod
    def validate_trend(cls, v: str) -> str:
        if v not in {"up", "down", "stable"}:
            return "stable"
        return v
