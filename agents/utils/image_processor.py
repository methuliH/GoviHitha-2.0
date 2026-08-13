"""Utilities for loading crop images from base64 strings or file paths."""
from __future__ import annotations

import base64
from pathlib import Path

from agents.utils.logger import get_logger

logger = get_logger(__name__)

_MAGIC = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"GIF8": "image/gif",
    b"RIFF": "image/webp",
}


def _detect_mime(data: bytes) -> str:
    for magic, mime in _MAGIC.items():
        if data[: len(magic)] == magic:
            return mime
    return "image/jpeg"


def load_image(source: str) -> tuple[bytes, str]:
    """Return (raw_bytes, mime_type) from a data URL, raw base64 string, or file path.

    Detection order — base64 is checked BEFORE the filesystem to prevent
    OSError ENAMETOOLONG on Linux when the caller passes a multi-KB base64 string:

    1. data URI  — "data:image/...;base64,<payload>"
    2. Raw base64 — decoded directly (covers the normal frontend code path)
    3. Filesystem path — only tried when source is short (<260 chars) and not
       decodable as base64 (e.g. unit-test fixtures or CLI usage)
    """
    # 1. Data URL
    if source.startswith("data:"):
        _, encoded = source.split(",", 1)
        try:
            data = base64.b64decode(encoded, validate=True)
        except Exception as exc:
            raise ValueError(f"Malformed data URL — base64 payload is invalid: {exc}") from exc
        logger.info("Loaded image from data URL (%d bytes decoded)", len(data))
        return data, _detect_mime(data)

    # 2. Raw base64 — attempt before touching the filesystem
    _decoded: bytes | None = None
    try:
        _decoded = base64.b64decode(source, validate=True)
    except Exception:
        pass  # not valid base64 — fall through to filesystem
    if _decoded is not None:
        if len(_decoded) < 4:
            raise ValueError("Decoded payload is too short to be a valid image")
        logger.info("Loaded image from raw base64 (%d bytes decoded)", len(_decoded))
        return _decoded, _detect_mime(_decoded)

    # 3. Filesystem path — only for short, non-base64 strings
    if len(source) < 260:
        try:
            path = Path(source)
            if path.exists() and path.is_file():
                logger.info("Loading image from file: %s", path.name)
                data = path.read_bytes()
                return data, _detect_mime(data)
        except OSError:
            pass

    raise ValueError(
        f"Image source is not a valid data URL, base64 string, or file path "
        f"(received {len(source)} chars, starts with: {source[:40]!r})"
    )
