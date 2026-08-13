"""Gemini Vision wrapper for crop image analysis."""
from __future__ import annotations

from google.genai.types import GenerateContentConfig, Part

from agents.config.settings import settings
from agents.utils.logger import get_logger

logger = get_logger(__name__)


def call_gemini_vision(
    image_bytes: bytes,
    mime_type: str,
    user_prompt: str,
    system_prompt: str,
    timeout: int = 30,
) -> str:
    """Send an image + text prompt to Gemini and return the raw text response.

    Raises:
        ValueError: if the API key is not configured.
        google.genai.errors.APIError: on API-level failures.
    """
    client = settings.get_gemini_client()

    image_part = Part.from_bytes(data=image_bytes, mime_type=mime_type)

    logger.info(
        "Calling Gemini Vision (model=%s, image_size=%d bytes)",
        settings.GEMINI_MODEL,
        len(image_bytes),
    )

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[image_part, user_prompt],
        config=GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )

    text = response.text.strip()
    logger.info("Gemini responded (%d chars)", len(text))
    return text
