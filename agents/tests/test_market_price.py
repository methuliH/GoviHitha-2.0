"""Unit tests for MarketPriceAgent -- pure computation, no network/API calls."""
from __future__ import annotations

from agents.agents.market_price import MarketPriceAgent
from agents.config.constants import CROP_TYPES

agent = MarketPriceAgent()


class TestMarketPriceAgent:
    def test_all_crop_types_resolve(self):
        for crop in CROP_TYPES:
            result = agent.check_price(crop)
            assert result.error is None, f"{crop} should resolve without error"
            assert result.todays_price_lkr > 0
            assert result.avg_price_30d_lkr > 0
            assert result.unit != "unknown"

    def test_deterministic_within_same_day(self):
        a = agent.check_price("rice")
        b = agent.check_price("rice")
        assert a.todays_price_lkr == b.todays_price_lkr
        assert a.price_change_pct == b.price_change_pct

    def test_different_crops_can_differ(self):
        rice = agent.check_price("rice")
        pepper = agent.check_price("pepper")
        assert rice.avg_price_30d_lkr != pepper.avg_price_30d_lkr

    def test_unknown_crop_returns_error_not_exception(self):
        result = agent.check_price("dragonfruit")
        assert result.error is not None
        assert result.todays_price_lkr == 0.0

    def test_trend_matches_price_change_sign(self):
        for crop in CROP_TYPES:
            result = agent.check_price(crop)
            if result.trend == "up":
                assert result.price_change_pct >= 5.0
            elif result.trend == "down":
                assert result.price_change_pct <= -5.0
            else:
                assert -5.0 < result.price_change_pct < 5.0

    def test_advisory_is_nonempty_and_never_raises(self):
        for crop in CROP_TYPES:
            result = agent.check_price(crop)
            assert isinstance(result.advisory, str) and len(result.advisory) > 0

    def test_case_insensitive_crop_lookup(self):
        lower = agent.check_price("rice")
        upper = agent.check_price("RICE")
        assert lower.todays_price_lkr == upper.todays_price_lkr
        assert upper.error is None


if __name__ == "__main__":
    import subprocess, sys
    subprocess.run([sys.executable, "-m", "pytest", __file__, "-v"])
