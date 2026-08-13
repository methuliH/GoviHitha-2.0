"""MarketPriceAgent -- today's farm-gate price vs. the recent average, for a crop.

Standalone agent, not part of OrchestratorAgent's pipeline: a single-tap flow needing
only crop_type, no diagnosis or region dependency. Deliberately makes no Gemini call --
this is a pure lookup + calculation, same pattern as ResourceRecommendationAgent's
static Hayleys catalog lookup. See doc/MarketPriceCheckerPlan.md for the scope
rationale (representative price data + deterministic daily variation, not a live
government feed).
"""
from __future__ import annotations

import hashlib
from datetime import date

from agents.data.market_prices import get_price_data
from agents.schemas.market_price_schema import MarketPriceResult
from agents.utils.logger import get_logger

logger = get_logger(__name__)

_TREND_THRESHOLD_PCT = 5.0


def _todays_offset_pct(crop_type: str, today: date) -> float:
    """Deterministic pseudo-random offset in [-1.0, 1.0], stable per (crop, date)."""
    seed = f"{crop_type.lower()}:{today.isoformat()}"
    digest = hashlib.sha256(seed.encode()).hexdigest()
    return (int(digest, 16) % 2001 - 1000) / 1000


def _advisory_for(trend: str, change_pct: float, crop_type: str) -> str:
    if trend == "up":
        return (
            f"Prices are {abs(change_pct):.0f}% above the recent average for {crop_type} -- "
            "a good time to sell if you have stock ready."
        )
    if trend == "down":
        return (
            f"Prices are {abs(change_pct):.0f}% below the recent average for {crop_type} -- "
            "consider holding if you can, or factor this into your asking price."
        )
    return (
        f"Prices are close to the recent average for {crop_type} -- "
        "a fair baseline to start negotiating from."
    )


def _fallback(crop_type: str, error: str) -> MarketPriceResult:
    return MarketPriceResult(
        crop_type=crop_type,
        unit="unknown",
        todays_price_lkr=0.0,
        avg_price_30d_lkr=0.0,
        price_change_pct=0.0,
        trend="stable",
        advisory="Price data unavailable for this crop.",
        last_updated=date.today().isoformat(),
        error=error,
    )


class MarketPriceAgent:
    """Stateless agent: call check_price() for today's farm-gate price vs. recent average."""

    def check_price(self, crop_type: str) -> MarketPriceResult:
        """Return a MarketPriceResult for the given crop.

        Never raises -- always returns a MarketPriceResult, with `error` set if the
        crop isn't in the curated dataset.
        """
        logger.info("Market price request: crop=%s", crop_type)

        data = get_price_data(crop_type)
        if data is None:
            logger.warning("No market price data for crop '%s'", crop_type)
            return _fallback(crop_type, f"No price data for crop '{crop_type}'.")

        today = date.today()
        offset = _todays_offset_pct(crop_type, today)
        avg_price = data["avg_price_lkr"]
        volatility = data["volatility_pct"]

        todays_price = round(avg_price * (1 + offset * volatility), 2)
        change_pct = round((todays_price - avg_price) / avg_price * 100, 1)

        if change_pct >= _TREND_THRESHOLD_PCT:
            trend = "up"
        elif change_pct <= -_TREND_THRESHOLD_PCT:
            trend = "down"
        else:
            trend = "stable"

        result = MarketPriceResult(
            crop_type=crop_type,
            unit=data["unit"],
            todays_price_lkr=todays_price,
            avg_price_30d_lkr=avg_price,
            price_change_pct=change_pct,
            trend=trend,
            advisory=_advisory_for(trend, change_pct, crop_type),
            last_updated=today.isoformat(),
        )
        logger.info(
            "Market price complete: %s %.2f LKR (%s%.1f%%, %s)",
            crop_type, todays_price, "+" if change_pct >= 0 else "", change_pct, trend,
        )
        return result
