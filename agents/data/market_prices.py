"""Loader for the curated market price reference data (market_prices.json)."""
from __future__ import annotations

import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent
_PRICES: dict[str, dict] = json.loads(
    (_DATA_DIR / "market_prices.json").read_text(encoding="utf-8")
)
_PRICES.pop("_meta", None)


def get_price_data(crop_type: str) -> dict | None:
    """Return the {unit, avg_price_lkr, volatility_pct} entry for crop_type, or None."""
    return _PRICES.get(crop_type.lower())
