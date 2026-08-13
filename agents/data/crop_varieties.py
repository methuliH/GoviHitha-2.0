"""Loader for the curated crop variety reference data (crop_varieties.json)."""
from __future__ import annotations

import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent
_VARIETIES: dict[str, list[dict]] = json.loads(
    (_DATA_DIR / "crop_varieties.json").read_text(encoding="utf-8")
)
_VARIETIES.pop("_meta", None)


def get_varieties(crop_type: str) -> list[dict]:
    """Return the curated variety list for crop_type, or [] if unknown."""
    return _VARIETIES.get(crop_type.lower(), [])
