"""Retry logic with exponential backoff for Gemini API calls."""
from __future__ import annotations

import time
from collections.abc import Callable
from typing import TypeVar

from agents.utils.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T")

_RETRYABLE = (TimeoutError, ConnectionError, OSError)

try:
    from google.genai.errors import APIError as GenAIAPIError
    _RETRYABLE = (*_RETRYABLE, GenAIAPIError)  # type: ignore[assignment]
except ImportError:
    pass


def with_retry(fn: Callable[[], T], max_retries: int = 3, base_delay: float = 1.0) -> T:
    """Call fn up to max_retries times with exponential backoff.

    Returns the first successful result. Raises the last exception if all
    attempts fail — callers decide the fallback strategy.
    """
    last_exc: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            return fn()
        except _RETRYABLE as exc:
            # 400/401/403 are permanent failures — retrying won't help
            if isinstance(exc, GenAIAPIError):
                code = getattr(exc, 'code', None) or getattr(exc, 'status_code', None)
                if code in (400, 401, 403):
                    raise
            last_exc = exc
            delay = base_delay * (2 ** (attempt - 1))
            logger.warning(
                "Attempt %d/%d failed (%s). Retrying in %.1fs…",
                attempt, max_retries, type(exc).__name__, delay,
            )
            time.sleep(delay)
        except Exception:
            raise  # non-retryable — bubble immediately

    raise last_exc  # type: ignore[misc]
