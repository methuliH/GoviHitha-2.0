"""PlantingAdvisorAgent -- recommends a crop variety and sowing window.

Standalone agent, not part of OrchestratorAgent's pipeline: unlike diagnosis/weather/
resources, this flow starts from crop + region alone (no photo, no symptoms), so it
runs as its own request/response cycle via POST /advise.
"""
from __future__ import annotations

import json
from datetime import date, datetime

from google.genai.types import GenerateContentConfig

from agents.config.constants import DEFAULT_COORDINATES, REGION_COORDINATES
from agents.config.settings import settings
from agents.data.crop_varieties import get_varieties
from agents.prompts.planting_advisor_prompt import PLANTING_ADVISOR_PROMPT
from agents.schemas.planting_schema import PlantingAdvice, VarietyRecommendation
from agents.tools.openmeteo_weather import fetch_forecast
from agents.utils.error_handler import with_retry
from agents.utils.logger import get_logger

logger = get_logger(__name__)


def _season_for_date(d: date) -> str:
    """Maha: Oct-Feb, Yala: May-Sep. Mar/Apr and Sep/Oct are transitional -- default
    to the season they lead into."""
    if d.month in (10, 11, 12, 1, 2):
        return "Maha"
    return "Yala"


def _fallback(crop_type: str, region: str, error: str, variety: VarietyRecommendation | None) -> PlantingAdvice:
    today = date.today()
    return PlantingAdvice(
        crop_type=crop_type,
        region=region,
        recommended_variety=variety or VarietyRecommendation(
            variety_name="Unknown", reason="No variety data available.", days_to_maturity=0
        ),
        sowing_window_label="Unavailable",
        sowing_window_start=today.isoformat(),
        sowing_window_end=today.isoformat(),
        season=_season_for_date(today),
        risk_notes=[],
        confidence="low",
        advisory_summary="Planting advice unavailable.",
        error=error,
    )


class PlantingAdvisorAgent:
    """Stateless agent: call advise() to get a variety + sowing window recommendation."""

    def advise(self, crop_type: str, region: str) -> PlantingAdvice:
        """Return a PlantingAdvice for the given crop and district.

        Args:
            crop_type: e.g. "rice", "tea"
            region: Sri Lankan district name (e.g. "Kandy")

        Returns:
            PlantingAdvice -- always returned, never raises.
        """
        logger.info("Planting advice request: crop=%s region=%s", crop_type, region)

        # 1. Look up curated varieties for this crop
        varieties = get_varieties(crop_type)
        if not varieties:
            return _fallback(crop_type, region, f"No variety data for crop '{crop_type}'.", None)
        default_variety = VarietyRecommendation(
            variety_name=varieties[0]["variety_name"],
            reason="Default pick -- AI recommendation unavailable.",
            days_to_maturity=varieties[0]["days_to_maturity"],
        )

        # 2. Resolve coordinates
        lat, lon = REGION_COORDINATES.get(region, DEFAULT_COORDINATES)
        if region not in REGION_COORDINATES:
            logger.warning("Unknown region '%s', using island centre coordinates", region)

        # 3. Fetch 16-day forecast (with retry)
        try:
            raw_forecast = with_retry(
                lambda: fetch_forecast(lat, lon, days=16),
                max_retries=settings.DIAGNOSIS_MAX_RETRIES,
            )
        except Exception as exc:
            logger.error("OpenMeteo forecast fetch failed: %s", exc)
            return _fallback(crop_type, region, f"Forecast fetch failed: {exc}", default_variety)

        # 4. Build Gemini prompt
        today_str = datetime.now().strftime("%Y-%m-%d")
        variety_lines = "\n".join(
            f"  - {v['variety_name']} (days to maturity: {v['days_to_maturity']}, traits: {', '.join(v['traits'])})"
            for v in varieties
        )
        forecast_lines = "\n".join(
            f"  {d['date']}: rain {d['precipitation_mm']}mm, temp {d['temp_min']}-{d['temp_max']}°C"
            for d in raw_forecast["days"]
        )
        user_prompt = (
            f"Crop: {crop_type}\n"
            f"District: {region} (Sri Lanka)\n"
            f"Today's date: {today_str}\n\n"
            f"Available varieties (choose exactly one of these):\n{variety_lines}\n\n"
            f"16-day forecast:\n{forecast_lines}\n\n"
            "Recommend the best variety and a sowing window. Return structured JSON."
        )

        # 5. Call Gemini
        if not settings.GOOGLE_API_KEY and not settings.GOOGLE_CLOUD_PROJECT:
            logger.warning("No Gemini auth configured -- returning default variety without AI reasoning")
            return _fallback(crop_type, region, "AI recommendation unavailable (no API key).", default_variety)

        try:
            raw_text = with_retry(
                lambda: _call_gemini(user_prompt),
                max_retries=settings.DIAGNOSIS_MAX_RETRIES,
            )
        except Exception as exc:
            logger.error("Gemini call failed after retries: %s", exc)
            return _fallback(crop_type, region, str(exc), default_variety)

        # 6. Parse, validate, and guard against variety hallucination
        try:
            clean = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean)

            valid_names = {v["variety_name"] for v in varieties}
            picked_name = data.get("recommended_variety", {}).get("variety_name")
            if picked_name not in valid_names:
                logger.warning(
                    "Gemini picked a variety not in the given list ('%s') -- falling back to %s",
                    picked_name, varieties[0]["variety_name"],
                )
                data["recommended_variety"] = {
                    "variety_name": varieties[0]["variety_name"],
                    "reason": "Fell back to the first listed variety (model returned an unlisted name).",
                    "days_to_maturity": varieties[0]["days_to_maturity"],
                }

            data["crop_type"] = crop_type
            data["region"] = region

            result = PlantingAdvice.model_validate(data)
            logger.info(
                "Planting advice complete: %s (%s), window %s",
                result.recommended_variety.variety_name, result.season, result.sowing_window_label,
            )
            return result

        except Exception as exc:
            logger.error("Failed to parse Gemini response: %s | raw=%s", exc, raw_text[:200])
            return _fallback(crop_type, region, f"Parse error: {exc}", default_variety)


def _call_gemini(user_prompt: str) -> str:
    client = settings.get_gemini_client()
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=user_prompt,
        config=GenerateContentConfig(
            system_instruction=PLANTING_ADVISOR_PROMPT,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    return response.text.strip()
