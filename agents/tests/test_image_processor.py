"""Unit tests for agents/utils/image_processor.py::load_image.

Run:
    python -m pytest agents/tests/test_image_processor.py -v
"""
from __future__ import annotations

import base64

import pytest

from agents.utils.image_processor import load_image

# ---------------------------------------------------------------------------
# Fixtures — real minimal image bytes so _detect_mime gives correct results
# ---------------------------------------------------------------------------

# 1x1 blank PNG — same image used in the CLAUDE.md smoke test
_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
_PNG_BYTES = base64.b64decode(_PNG_B64)
_PNG_DATA_URL = f"data:image/png;base64,{_PNG_B64}"

# Minimal JPEG — just the SOI marker + enough padding to decode cleanly
_JPEG_BYTES = b"\xff\xd8\xff" + b"\xe0" * 16
_JPEG_B64 = base64.b64encode(_JPEG_BYTES).decode()


# ---------------------------------------------------------------------------
# Raw base64 (the normal frontend code path)
# ---------------------------------------------------------------------------

def test_raw_base64_png_roundtrip():
    data, mime = load_image(_PNG_B64)
    assert data == _PNG_BYTES
    assert mime == "image/png"


def test_raw_base64_jpeg_magic():
    data, mime = load_image(_JPEG_B64)
    assert data[:3] == b"\xff\xd8\xff"
    assert mime == "image/jpeg"


# ---------------------------------------------------------------------------
# Data URL (e.g. if a caller skips the strip-prefix step)
# ---------------------------------------------------------------------------

def test_data_url_png():
    data, mime = load_image(_PNG_DATA_URL)
    assert data == _PNG_BYTES
    assert mime == "image/png"


def test_data_url_jpeg():
    data_url = f"data:image/jpeg;base64,{_JPEG_B64}"
    data, mime = load_image(data_url)
    assert data[:3] == b"\xff\xd8\xff"
    assert mime == "image/jpeg"


# ---------------------------------------------------------------------------
# Error cases — must raise ValueError with a clear message, never OSError
# ---------------------------------------------------------------------------

def test_garbage_short_string_raises_value_error():
    with pytest.raises(ValueError, match="not a valid"):
        load_image("not-base64-nor-a-path!!!")


def test_long_base64_like_garbage_raises_value_error_not_os_error():
    # Reproduces the original crash: >255 chars that aren't valid base64.
    # Must NOT raise OSError (ENAMETOOLONG); must raise ValueError instead.
    bad = "A" * 260 + "!!!"
    with pytest.raises(ValueError):
        load_image(bad)


def test_malformed_data_url_raises_value_error():
    with pytest.raises(ValueError, match="Malformed data URL"):
        load_image("data:image/jpeg;base64,THIS-IS-NOT-VALID-BASE64!!!")


def test_empty_string_raises_value_error():
    with pytest.raises(ValueError):
        load_image("")
