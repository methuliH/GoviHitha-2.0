"""Pydantic output schemas for the ResourceRecommendationAgent."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ProductRecommendation(BaseModel):
    type: str  # "fungicide" | "insecticide" | "nematicide" | "herbicide" | "biological insecticide"
    product_name: str
    active_ingredient: str = ""
    why: str
    availability: str = "Available through Hayleys Agriculture dealers across Sri Lanka."
    estimated_cost: str = "Contact dealer for pricing"
    application_notes: Optional[str] = None
    hayleys_product_url: str = ""
    dealer_url: str = ""
    # Kept for backwards compatibility; empty string when not applicable
    kapruka_search_link: str = ""


class ResourceResult(BaseModel):
    recommendations: list[ProductRecommendation]
    priority_note: str
    error: Optional[str] = None
