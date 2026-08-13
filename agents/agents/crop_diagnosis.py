"""CropDiagnosisAgent — diagnoses crop diseases from images and symptoms."""
from __future__ import annotations

import json

from agents.agents.crop_disease_plausibility import is_plausible
from agents.config.settings import settings
from agents.prompts.crop_diagnosis_prompt import CROP_DIAGNOSIS_PROMPT
from agents.schemas.diagnosis_schema import DiagnosisResult
from agents.tools.gemini_vision import call_gemini_vision
from agents.utils.error_handler import with_retry
from agents.utils.image_processor import load_image
from agents.utils.logger import get_logger

logger = get_logger(__name__)


class CropDiagnosisAgent:
    """Stateless agent: call diagnose() to analyse one farmer query."""

    def diagnose(
        self,
        crop_type: str,
        symptoms: str,
        image_source: str,
        region: str,
    ) -> DiagnosisResult:
        """Return a DiagnosisResult for the given crop image and symptoms.

        Args:
            crop_type: e.g. "rice", "tea", "coconut"
            symptoms: free-text description from the farmer
            image_source: base64-encoded image string or file path
            region: Sri Lankan district, e.g. "Kandy"

        Returns:
            DiagnosisResult — always returned, never raises. On failure,
            disease_name="Unable to Diagnose" and error field is populated.
        """
        logger.info("Received diagnosis request: crop=%s region=%s", crop_type, region)

        # 1. Load image
        try:
            image_bytes, mime_type = load_image(image_source)
        except ValueError as exc:
            logger.error("Image load failed: %s", exc)
            return DiagnosisResult(
                disease_name="Unable to Diagnose",
                confidence=0.0,
                description="Could not load the provided image.",
                treatment_steps=[],
                timeline="N/A",
                prevention="Ensure image is a valid JPEG/PNG file or base64 string.",
                risk_level="medium",
                error=str(exc),
            )

        # 2. Build user prompt
        user_prompt = (
            f"Crop: {crop_type}\n"
            f"Region: {region} (Sri Lanka)\n"
            f"Farmer-reported symptoms: {symptoms}\n\n"
            "Diagnose the disease shown in the image."
        )

       # Call gemini with retry logic
        try:
            raw_text = with_retry(
                lambda: call_gemini_vision(
                    image_bytes=image_bytes,
                    mime_type=mime_type,
                    user_prompt=user_prompt,
                    system_prompt=CROP_DIAGNOSIS_PROMPT,
                    timeout=settings.DIAGNOSIS_TIMEOUT_SECONDS,
                ),
                max_retries=settings.DIAGNOSIS_MAX_RETRIES,
            )
        except Exception as exc:
            logger.error("Gemini call failed after retries: %s", exc)
            return DiagnosisResult(
                disease_name="Unable to Diagnose",
                confidence=0.0,
                description="The AI service could not be reached. Please try again.",
                treatment_steps=[],
                timeline="N/A",
                prevention="Check your internet connection and API key.",
                risk_level="medium",
                error=str(exc),
            )

        # 4. Parse and validate JSON
        try:
            # Strip markdown fences if Gemini returns them despite instructions
            clean = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean)
            result = DiagnosisResult.model_validate(data)
            if not is_plausible(crop_type, result.disease_name):
                result = result.model_copy(update={"crop_disease_mismatch_warning": True})
            logger.info(
                "Diagnosis complete: %s (confidence=%.2f, risk=%s, mismatch_warning=%s)",
                result.disease_name, result.confidence, result.risk_level,
                result.crop_disease_mismatch_warning,
            )
            return result
        except (json.JSONDecodeError, Exception) as exc:
            logger.error("Failed to parse Gemini response: %s | raw=%s", exc, raw_text[:200])
            return DiagnosisResult(
                disease_name="Unable to Diagnose",
                confidence=0.0,
                description="The AI returned an unexpected response format.",
                treatment_steps=[],
                timeline="N/A",
                prevention="Please try again or contact support.",
                risk_level="medium",
                error=f"Parse error: {exc}",
            )
