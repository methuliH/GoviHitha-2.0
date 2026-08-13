"""ResourceRecommendationAgent — matches diagnosed diseases to Hayleys Agriculture products.

Uses a static, locally-stored product catalog scraped from
https://www.hayleysagriculture.com (point-in-time snapshot, see
agents/data/hayleys_products.json).  No live scraping on every request.

Hayleys Agriculture is a Sri Lankan crop-protection distributor — no checkout,
no prices.  Recommendations link to the product info page + their dealer locator.
"""
from __future__ import annotations

from agents.data import hayleys_disease_map as _hayleys
from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.resource_schema import ProductRecommendation, ResourceResult
from agents.schemas.weather_schema import WeatherResult
from agents.utils.logger import get_logger

logger = get_logger(__name__)

_NO_MATCH_NOTE = (
    "No specific Hayleys Agriculture product was found for this disease in our catalog. "
    "Visit a local agricultural supply shop or contact Hayleys Agriculture directly "
    "at https://www.hayleysagriculture.com for expert advice."
)


class ResourceRecommendationAgent:
    """Stateless agent: call recommend() to look up Hayleys products for a diagnosis."""

    def recommend(
        self,
        crop_type: str,
        diagnosis: DiagnosisResult,
        weather: WeatherResult,
        region: str,
    ) -> ResourceResult:
        """Return Hayleys product recommendations for the given diagnosis.

        Looks up the disease in the static Hayleys catalog mapping.  If a match
        is found, returns structured product info with product-page URL and dealer
        locator link.  If no match, returns an explicit no-match result — never
        fabricates products or links.
        """
        logger.info(
            "Hayleys lookup: crop=%s region=%s disease=%s",
            crop_type, region, diagnosis.disease_name,
        )

        matched = _hayleys.lookup(crop_type, diagnosis.disease_name)

        if not matched:
            logger.info("No Hayleys match for disease=%s crop=%s", diagnosis.disease_name, crop_type)
            return ResourceResult(
                recommendations=[],
                priority_note=_NO_MATCH_NOTE,
            )

        recommendations: list[ProductRecommendation] = []
        for product in matched:
            recommendations.append(ProductRecommendation(
                type=product["category"],
                product_name=product["name"],
                active_ingredient=product["active_ingredient"],
                why=product["why"],
                availability="Available through Hayleys Agriculture dealers across Sri Lanka.",
                estimated_cost="Contact dealer for pricing",
                application_notes=product.get("description"),
                hayleys_product_url=product["url"],
                dealer_url=_hayleys.DEALER_URL,
            ))

        priority_note = _build_priority_note(diagnosis, weather, recommendations)

        logger.info(
            "Hayleys lookup complete: %d product(s) matched — %s",
            len(recommendations),
            ", ".join(r.product_name for r in recommendations),
        )
        return ResourceResult(recommendations=recommendations, priority_note=priority_note)


def _build_priority_note(
    diagnosis: DiagnosisResult,
    weather: WeatherResult,
    recommendations: list[ProductRecommendation],
) -> str:
    product_names = " and ".join(r.product_name for r in recommendations)
    note = f"Source {product_names} from a Hayleys Agriculture dealer as soon as possible."

    if weather.alerts:
        top = weather.alerts[0]
        days = top.days_ahead
        risk = top.risk_type.replace("_", " ").title()
        note += (
            f" {risk} risk expected in {days} day(s) — "
            f"apply treatment before conditions worsen."
        )

    return note
