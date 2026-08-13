"""OrchestratorAgent — coordinates all three specialist agents."""
from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor

from agents.agents.crop_diagnosis import CropDiagnosisAgent
from agents.agents.resource_recommendation import ResourceRecommendationAgent
from agents.agents.weather_alert import WeatherAlertAgent
from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.schemas.orchestrator_schema import OrchestrationResult
from agents.schemas.resource_schema import ResourceResult
from agents.schemas.weather_schema import CurrentWeather, WeatherResult
from agents.utils.logger import get_logger

logger = get_logger(__name__)

_diagnosis_agent = CropDiagnosisAgent()
_weather_agent = WeatherAlertAgent()
_resource_agent = ResourceRecommendationAgent()

# Fallbacks used when an agent fails entirely
_WEATHER_FALLBACK = WeatherResult(
    current_weather=CurrentWeather(temperature=0.0, humidity=0.0, rainfall_7d=0.0),
    alerts=[],
    forecast_summary="Weather data unavailable.",
    error="Agent did not return a result.",
)
_RESOURCE_FALLBACK = ResourceResult(
    recommendations=[],
    priority_note="Resource recommendations unavailable.",
    error="Agent did not return a result.",
)


class OrchestratorAgent:
    """Runs CropDiagnosis first, then WeatherAlert + ResourceRecommendation in parallel.

    Pipeline:
        1. CropDiagnosisAgent  (image + symptoms → diagnosis)
        2. WeatherAlertAgent   ┐ parallel, both depend on diagnosis
           ResourceRecommendationAgent ┘
        3. Synthesise → OrchestrationResult
    """

    def run(
        self,
        crop_type: str,
        symptoms: str,
        image_source: str,
        region: str,
    ) -> OrchestrationResult:
        """Execute the full pipeline and return a synthesised result.

        Always returns an OrchestrationResult — never raises.
        """
        logger.info(
            "Orchestration started: crop=%s region=%s", crop_type, region
        )

        # Step 1: Diagnosis (sequential — weather + resources depend on it)
        diagnosis = _diagnosis_agent.diagnose(
            crop_type=crop_type,
            symptoms=symptoms,
            image_source=image_source,
            region=region,
        )
        logger.info("Diagnosis complete: %s", diagnosis.disease_name)

        # Step 2: Weather + Resources in parallel (both need diagnosis output)
        weather, resources = _run_parallel(
            lambda: _weather_agent.analyse(
                region=region,
                crop_type=crop_type,
                diagnosis=diagnosis,
            ),
            lambda: _resource_agent.recommend(
                crop_type=crop_type,
                diagnosis=diagnosis,
                weather=_WEATHER_FALLBACK,  # best-effort; real weather available after step 2
                region=region,
            ),
        )

        # If weather succeeded, re-run resource agent with real weather context
        # (only if the first resource call had errors or weather data was real)
        if weather.error is None and resources.error is not None:
            logger.info("Re-running resource agent with real weather data")
            resources = _resource_agent.recommend(
                crop_type=crop_type,
                diagnosis=diagnosis,
                weather=weather,
                region=region,
            )

        # Step 3: Synthesise
        result = _synthesise(crop_type, region, diagnosis, weather, resources)
        logger.info("Orchestration complete: %s", result.situation_summary[:80])
        return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _run_parallel(fn_a, fn_b) -> tuple:
    """Run two blocking callables in parallel using a thread pool."""
    with ThreadPoolExecutor(max_workers=2) as pool:
        future_a = pool.submit(fn_a)
        future_b = pool.submit(fn_b)
        result_a = future_a.result()
        result_b = future_b.result()
    return result_a, result_b


def _synthesise(
    crop_type: str,
    region: str,
    diagnosis: DiagnosisResult,
    weather: WeatherResult,
    resources: ResourceResult,
) -> OrchestrationResult:
    """Build a human-readable situation summary and prioritised action plan."""

    disease = diagnosis.disease_name
    top_alert = weather.alerts[0] if weather.alerts else None
    top_product = resources.recommendations[0] if resources.recommendations else None

    # Situation summary
    weather_clause = (
        f"{top_alert.risk_type.replace('_', ' ').title()} risk ({top_alert.likelihood}) "
        f"in {top_alert.days_ahead} day(s) will worsen the situation."
        if top_alert else "No immediate weather threats detected."
    )
    situation_summary = (
        f"Your {crop_type} crop in {region} has been diagnosed with {disease}. "
        f"{weather_clause} "
        f"{'Immediate action required.' if diagnosis.risk_level == 'high' else 'Monitor closely and treat promptly.'}"
    )

    # Prioritised action plan
    action_plan: list[str] = []

    if top_product:
        action_plan.append(
            f"Buy {top_product.product_name} today ({top_product.estimated_cost}) — {top_product.why}"
        )

    for i, step in enumerate(diagnosis.treatment_steps[:3], start=len(action_plan) + 1):
        action_plan.append(f"{step}")

    if top_alert and top_alert.days_ahead <= 2:
        action_plan.append(top_alert.action)

    action_plan.append(
        f"Recheck your crop in {diagnosis.timeline} to assess recovery."
    )

    return OrchestrationResult(
        situation_summary=situation_summary,
        diagnosis=diagnosis,
        weather=weather,
        resources=resources,
        action_plan=action_plan,
        timeline=diagnosis.timeline,
    )
