"""WeatherAlertAgent — contextualises real weather data against a crop diagnosis."""
from __future__ import annotations

import json

from google.genai.types import GenerateContentConfig

from agents.config.constants import DEFAULT_COORDINATES, REGION_COORDINATES
from agents.config.settings import settings
from agents.prompts.weather_alert_prompt import WEATHER_ALERT_PROMPT
from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.weather_schema import CurrentWeather, WeatherAlert, WeatherResult
from agents.tools.openmeteo_weather import fetch_weather
from agents.utils.error_handler import with_retry
from agents.utils.logger import get_logger

logger = get_logger(__name__)

_FALLBACK_WEATHER = WeatherResult(
    current_weather=CurrentWeather(temperature=0.0, humidity=0.0, rainfall_7d=0.0),
    alerts=[],
    forecast_summary="Weather data unavailable.",
)


def _fallback(error: str) -> WeatherResult:
    return WeatherResult(
        current_weather=CurrentWeather(temperature=0.0, humidity=0.0, rainfall_7d=0.0),
        alerts=[],
        forecast_summary="Weather data unavailable.",
        error=error,
    )


class WeatherAlertAgent:
    """Stateless agent: call analyse() to get weather risk alerts for a diagnosis."""

    def analyse(
        self,
        region: str,
        crop_type: str,
        diagnosis: DiagnosisResult,
    ) -> WeatherResult:
        """Return a WeatherResult contextualised to the diagnosed disease.

        Args:
            region: Sri Lankan district name (e.g. "Kandy")
            crop_type: e.g. "rice", "tea"
            diagnosis: output from CropDiagnosisAgent

        Returns:
            WeatherResult — always returned, never raises.
        """
        logger.info("Weather analysis request: region=%s crop=%s disease=%s",
                    region, crop_type, diagnosis.disease_name)

        # 1. Resolve coordinates
        lat, lon = REGION_COORDINATES.get(region, DEFAULT_COORDINATES)
        if region not in REGION_COORDINATES:
            logger.warning("Unknown region '%s', using island centre coordinates", region)

        # 2. Fetch live weather (with retry)
        try:
            raw_weather = with_retry(
                lambda: fetch_weather(lat, lon),
                max_retries=settings.DIAGNOSIS_MAX_RETRIES,
            )
        except Exception as exc:
            logger.error("OpenMeteo fetch failed: %s", exc)
            return _fallback(f"Weather fetch failed: {exc}")

        # 3. Build Gemini prompt with weather + diagnosis context
        user_prompt = (
            f"Crop: {crop_type}\n"
            f"Region: {region} (Sri Lanka)\n"
            f"Diagnosed disease: {diagnosis.disease_name} (risk level: {diagnosis.risk_level})\n"
            f"Disease description: {diagnosis.description}\n\n"
            f"Real-time weather data:\n"
            f"  Current temperature: {raw_weather['current_temperature']}°C\n"
            f"  Current humidity: {raw_weather['current_humidity']}%\n"
            f"  Total rainfall last 7 days: {raw_weather['rainfall_7d']} mm\n"
            f"  Daily precipitation forecast (mm): {raw_weather['daily_precipitation']}\n"
            f"  Daily max temps (°C): {raw_weather['daily_temp_max']}\n"
            f"  Daily min temps (°C): {raw_weather['daily_temp_min']}\n\n"
            "Identify all weather risks that will worsen this specific disease. "
            "Return structured JSON alerts."
        )

        # 4. Call Gemini for risk contextualisation (with retry)
        if not settings.GOOGLE_API_KEY and not settings.GOOGLE_CLOUD_PROJECT:
            logger.warning("No Gemini auth configured — returning weather-only result without AI alerts")
            return WeatherResult(
                current_weather=CurrentWeather(
                    temperature=raw_weather["current_temperature"],
                    humidity=raw_weather["current_humidity"],
                    rainfall_7d=raw_weather["rainfall_7d"],
                ),
                alerts=[],
                forecast_summary="AI contextualisation unavailable (no API key).",
            )

        try:
            raw_text = with_retry(
                lambda: _call_gemini(user_prompt),
                max_retries=settings.DIAGNOSIS_MAX_RETRIES,
            )
        except Exception as exc:
            logger.error("Gemini call failed after retries: %s", exc)
            # Still return real weather even if AI step fails
            return WeatherResult(
                current_weather=CurrentWeather(
                    temperature=raw_weather["current_temperature"],
                    humidity=raw_weather["current_humidity"],
                    rainfall_7d=raw_weather["rainfall_7d"],
                ),
                alerts=[],
                forecast_summary="Weather data retrieved but AI analysis unavailable.",
                error=str(exc),
            )

        # 5. Parse and validate
        try:
            clean = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean)

            # Override current_weather with real fetched values (ground truth)
            data["current_weather"] = {
                "temperature": raw_weather["current_temperature"],
                "humidity": raw_weather["current_humidity"],
                "rainfall_7d": raw_weather["rainfall_7d"],
            }

            result = WeatherResult.model_validate(data)
            logger.info(
                "Weather analysis complete: %d alert(s) — %s",
                len(result.alerts),
                result.forecast_summary[:80],
            )
            return result

        except Exception as exc:
            logger.error("Failed to parse Gemini response: %s | raw=%s", exc, raw_text[:200])
            return WeatherResult(
                current_weather=CurrentWeather(
                    temperature=raw_weather["current_temperature"],
                    humidity=raw_weather["current_humidity"],
                    rainfall_7d=raw_weather["rainfall_7d"],
                ),
                alerts=[],
                forecast_summary="Weather data retrieved but response parsing failed.",
                error=f"Parse error: {exc}",
            )


def _call_gemini(user_prompt: str) -> str:
    client = settings.get_gemini_client()
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=user_prompt,
        config=GenerateContentConfig(
            system_instruction=WEATHER_ALERT_PROMPT,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    return response.text.strip()
