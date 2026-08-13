"""OpenMeteo API wrapper — free, no auth required."""
from __future__ import annotations

import requests

from agents.utils.logger import get_logger

logger = get_logger(__name__)

_BASE_URL = "https://api.open-meteo.com/v1/forecast"
_TIMEOUT_SECONDS = 10


def fetch_weather(latitude: float, longitude: float) -> dict:
    """Fetch current conditions and 7-day forecast from OpenMeteo.

    Returns a dict with keys:
        current_temperature  (°C)
        current_humidity     (%)
        rainfall_7d          (mm total over 7 days)
        daily_precipitation  (list of 7 daily mm values)
        daily_temp_max       (list of 7 daily max °C)
        daily_temp_min       (list of 7 daily min °C)

    Raises:
        requests.RequestException: on network failures.
        ValueError: if the API returns an unexpected structure.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation",
        "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min",
        "forecast_days": 7,
        "timezone": "Asia/Colombo",
    }

    logger.info("Fetching OpenMeteo weather for (%.4f, %.4f)", latitude, longitude)
    response = requests.get(_BASE_URL, params=params, timeout=_TIMEOUT_SECONDS)
    response.raise_for_status()
    data = response.json()

    current = data.get("current", {})
    daily = data.get("daily", {})

    daily_precip: list[float] = daily.get("precipitation_sum", [])
    rainfall_7d = sum(v for v in daily_precip if v is not None)

    result = {
        "current_temperature": current.get("temperature_2m", 0.0),
        "current_humidity": current.get("relative_humidity_2m", 0.0),
        "rainfall_7d": round(rainfall_7d, 1),
        "daily_precipitation": daily_precip,
        "daily_temp_max": daily.get("temperature_2m_max", []),
        "daily_temp_min": daily.get("temperature_2m_min", []),
    }

    logger.info(
        "Weather fetched: temp=%.1f°C humidity=%.0f%% rainfall_7d=%.1fmm",
        result["current_temperature"],
        result["current_humidity"],
        result["rainfall_7d"],
    )
    return result


def fetch_forecast(latitude: float, longitude: float, days: int = 16) -> dict:
    """Fetch a multi-day forecast from OpenMeteo (max 16 days on the free tier).

    Unlike fetch_weather(), this returns dated daily entries so callers can pick a
    date-anchored window (e.g. a sowing window) rather than just totals.

    Returns a dict with keys:
        days: list of {date, precipitation_mm, temp_max, temp_min} dicts, one per
              forecast day (date is an ISO "YYYY-MM-DD" string)

    Raises:
        requests.RequestException: on network failures.
        ValueError: if the API returns an unexpected structure.
    """
    days = max(1, min(16, days))
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min",
        "forecast_days": days,
        "timezone": "Asia/Colombo",
    }

    logger.info("Fetching %d-day OpenMeteo forecast for (%.4f, %.4f)", days, latitude, longitude)
    response = requests.get(_BASE_URL, params=params, timeout=_TIMEOUT_SECONDS)
    response.raise_for_status()
    data = response.json()

    daily = data.get("daily", {})
    dates: list[str] = daily.get("time", [])
    precip: list[float] = daily.get("precipitation_sum", [])
    temp_max: list[float] = daily.get("temperature_2m_max", [])
    temp_min: list[float] = daily.get("temperature_2m_min", [])

    forecast_days = [
        {
            "date": dates[i],
            "precipitation_mm": precip[i] if i < len(precip) else 0.0,
            "temp_max": temp_max[i] if i < len(temp_max) else None,
            "temp_min": temp_min[i] if i < len(temp_min) else None,
        }
        for i in range(len(dates))
    ]

    logger.info("Forecast fetched: %d day(s)", len(forecast_days))
    return {"days": forecast_days}
