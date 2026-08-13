"""Heuristic plausibility check: is a diagnosed disease reasonable for the given crop?

This is a safety net, NOT authoritative plant pathology. The keyword lists cover
the ten crops in the frontend dropdown and their most common diseases in Sri Lanka.
An unlisted disease name is not necessarily wrong — Gemini may be correct about
something unusual. When the check fails, callers should log a warning and set
crop_disease_mismatch_warning=True on the result rather than discarding it.

Matching strategy: any keyword that appears as a case-insensitive substring of the
disease name makes it "plausible" for that crop.
"""
from __future__ import annotations

from agents.utils.logger import get_logger

logger = get_logger(__name__)

# Disease names containing these substrings are always considered plausible,
# regardless of crop, because they indicate the model declined to diagnose.
_ALWAYS_PASS = frozenset({"unable to diagnose", "healthy"})

# Per-crop keyword sets (all lowercase). A disease name is plausible if ANY
# keyword appears in its lowercased form. Lists are intentionally heuristic.
_PLAUSIBLE_KEYWORDS: dict[str, frozenset[str]] = {
    "rice": frozenset({
        "rice", "blast", "sheath", "planthopper", "tungro",
        "brown spot", "gall midge", "false smut", "smut", "stem rot",
        "narrow brown", "white tip", "bacterial leaf blight",
    }),
    "tomato": frozenset({
        "tomato", "early blight", "late blight", "alternaria", "septoria",
        "leaf curl", "mosaic", "fusarium", "bacterial wilt", "gray mold",
        "botrytis", "anthracnose", "spotted wilt", "blossom end",
    }),
    "potato": frozenset({
        "potato", "late blight", "early blight", "common scab", "blackleg",
        "bacterial soft rot", "fusarium", "rhizoctonia", "virus",
    }),
    "chilli": frozenset({
        "chilli", "anthracnose", "mosaic", "leaf curl", "bacterial wilt",
        "damping off", "cercospora", "fusarium", "thrips", "aphid",
    }),
    "coconut": frozenset({
        "coconut", "bud rot", "lethal yellowing", "root wilt",
        "leaf blight", "scale", "rhinoceros", "stem bleeding", "red palm",
    }),
    "tea": frozenset({
        "tea", "blister blight", "mosquito bug", "looper", "red spider",
        "tortrix", "gray blight", "dieback", "anthracnose",
    }),
    "banana": frozenset({
        "banana", "sigatoka", "bunchy top", "moko",
        "anthracnose", "crown rot", "weevil", "fusarium wilt",
    }),
    "pepper": frozenset({
        "pepper", "phytophthora", "anthracnose", "mosaic",
        "bacterial leaf spot", "powdery mildew", "root rot",
    }),
    "cassava": frozenset({
        "cassava", "mosaic", "brown streak", "bacterial blight",
        "anthracnose", "mite",
    }),
    "corn": frozenset({
        "corn", "maize", "northern leaf blight", "southern leaf blight",
        "gray leaf spot", "common rust", "smut", "downy mildew",
        "stalk rot", "armyworm", "lethal necrosis",
    }),
}


def is_plausible(crop_type: str, disease_name: str) -> bool:
    """Return True if disease_name is plausible for crop_type.

    Returns True for unknown crop types (no keyword list available), and always
    for "Healthy" / "Unable to Diagnose". A False result is a heuristic signal
    that the caller should surface as a warning, not treat as a hard failure.
    """
    lower_disease = disease_name.lower().strip()

    if any(token in lower_disease for token in _ALWAYS_PASS):
        return True

    keywords = _PLAUSIBLE_KEYWORDS.get(crop_type.lower().strip())
    if keywords is None:
        logger.debug("No plausibility list for crop '%s' — skipping check", crop_type)
        return True

    match = any(kw in lower_disease for kw in keywords)
    if not match:
        logger.warning(
            "Plausibility check FAILED: crop=%r disease=%r — "
            "no expected keyword found in disease name; "
            "setting crop_disease_mismatch_warning=True on result.",
            crop_type,
            disease_name,
        )
    return match
