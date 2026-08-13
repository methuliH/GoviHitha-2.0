"""Disease-to-Hayleys-product lookup.

Each rule is a (crop_keyword | None, disease_keyword, product_id, why) tuple.
Both keywords are matched as case-insensitive substrings of the actual crop/disease
strings from CropDiagnosisAgent. None as crop_keyword means "any crop".

Rules are checked in order; all matching rules contribute products (deduplicated).
Results are capped at 2 products to keep recommendations focused.

Only diseases that are genuinely covered by a Hayleys product's stated label produce
a match. Diseases with no Hayleys catalog entry return an empty list — no fabrication.
"""
from __future__ import annotations

import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent
_CATALOG = json.loads((_DATA_DIR / "hayleys_products.json").read_text(encoding="utf-8"))
_PRODUCTS: dict[str, dict] = {p["id"]: p for p in _CATALOG["products"]}

DEALER_URL: str = _CATALOG["_meta"]["dealer_url"]
HAYLEYS_BASE_URL: str = "https://www.hayleysagriculture.com"

# ---------------------------------------------------------------------------
# Rules: (crop_keyword | None, disease_keyword, product_id, why_text)
# ---------------------------------------------------------------------------
# Ordering: more-specific (crop+disease) rules appear before generic ones.
# ---------------------------------------------------------------------------
_RULES: list[tuple[str | None, str, str, str]] = [
    # ── Rice ──────────────────────────────────────────────────────────────
    ("rice", "blast",
     "folicur-tebuconazole",
     "Tebuconazole is explicitly listed for Rice Blast in paddy — systemic triazole with protective and curative action against Magnaporthe oryzae."),

    ("rice", "sheath blight",
     "hayleys-hexaconazole",
     "Hexaconazole is explicitly listed for paddy Sheath Blight — systemic triazole with curative action."),

    ("rice", "sheath blight",
     "folicur-tebuconazole",
     "Tebuconazole is also listed for paddy Sheath Blight — broad-spectrum systemic triazole."),

    ("rice", "sheath",
     "hayleys-hexaconazole",
     "Hexaconazole is listed for paddy Sheath Blight — systemic triazole."),

    (None, "brown plant hopper",
     "admire-imidacloprid",
     "Imidacloprid is explicitly listed for Paddy Brown Plant Hoppers — systemic neonicotinoid insecticide."),

    (None, "brown plant hopper",
     "hayleys-bmpc",
     "Fenobucarb (BMPC) is explicitly listed for rice plant hoppers — effective contact insecticide."),

    (None, "planthopper",
     "admire-imidacloprid",
     "Imidacloprid controls rice plant hoppers — systemic neonicotinoid insecticide."),

    (None, "planthopper",
     "hayleys-bmpc",
     "Fenobucarb (BMPC) is listed for rice plant hoppers — contact insecticide."),

    ("rice", "leafhopper",
     "hayleys-bmpc",
     "Fenobucarb (BMPC) is explicitly listed for rice leafhoppers — contact carbamate insecticide."),

    ("rice", "leafhopper",
     "admire-imidacloprid",
     "Imidacloprid is listed for sucking insects including rice leafhoppers — systemic neonicotinoid."),

    ("rice", "leaf roller",
     "hayleys-bmpc",
     "Fenobucarb (BMPC) is explicitly listed for rice leaf rollers."),

    ("rice", "borer",
     "hayleys-bmpc",
     "Fenobucarb (BMPC) is explicitly listed for rice borers."),

    ("rice", "grain discoloration",
     "antracol-propineb",
     "Propineb (Antracol) is explicitly listed for Paddy Field Grain Discoloration — contact protective fungicide."),

    ("rice", "field grain",
     "antracol-propineb",
     "Propineb (Antracol) is listed for Paddy Field Grain Discoloration."),

    # ── Tomato ────────────────────────────────────────────────────────────
    ("tomato", "early blight",
     "hayleys-mancozeb",
     "Mancozeb is explicitly listed for Tomato Early Blight (Alternaria solani) — broad-spectrum contact protectant fungicide."),

    ("tomato", "early blight",
     "antracol-propineb",
     "Propineb (Antracol) is explicitly listed for Tomato Early Blight — contact protective fungicide."),

    ("tomato", "late blight",
     "hayleys-mancozeb",
     "Mancozeb is explicitly listed for Potato and Tomato Late Blight (Phytophthora infestans) — broad-spectrum contact protectant."),

    ("tomato", "late blight",
     "antracol-propineb",
     "Propineb (Antracol) is listed for Tomato Late Blight — contact protective fungicide."),

    ("tomato", "alternaria",
     "hayleys-mancozeb",
     "Mancozeb is listed for Alternaria blight on tomato — broad-spectrum protectant fungicide."),

    # ── Potato ────────────────────────────────────────────────────────────
    ("potato", "late blight",
     "nando-fluazinam",
     "Fluazinam is explicitly formulated for Potato Blight and Tuber Blight — highly effective against Phytophthora infestans."),

    ("potato", "late blight",
     "hayleys-mancozeb",
     "Mancozeb is explicitly listed for Potato Late Blight — broad-spectrum contact protectant."),

    ("potato", "early blight",
     "hayleys-mancozeb",
     "Mancozeb is explicitly listed for Potato Early Blight — broad-spectrum protectant fungicide."),

    ("potato", "early blight",
     "antracol-propineb",
     "Propineb (Antracol) is listed for Potato Early Blight — contact protective fungicide."),

    ("potato", "black scurf",
     "monceren-wp-25",
     "Monceren (Pencycuron) is explicitly listed for Potato Black Scurf — non-systemic protective fungicide targeting Rhizoctonia solani."),

    ("potato", "stem canker",
     "monceren-wp-25",
     "Monceren (Pencycuron) is explicitly listed for Potato Stem Canker disease caused by Rhizoctonia solani."),

    ("potato", "rhizoctonia",
     "monceren-wp-25",
     "Monceren (Pencycuron) is listed for Rhizoctonia-caused diseases including Potato Black Scurf and Stem Canker."),

    # ── Chilli / Capsicum ─────────────────────────────────────────────────
    ("chilli", "anthracnose",
     "nativo-75-wg",
     "Nativo (Trifloxystrobin + Tebuconazole) is explicitly listed for Capsicum Anthracnose — combines systemic and contact action against Colletotrichum spp."),

    ("chilli", "leaf curl",
     "admire-imidacloprid",
     "Imidacloprid is explicitly listed for Chilli/Capsicum Leaf Curl Complex and its thrips/aphid vectors — systemic neonicotinoid."),

    ("chilli", "leaf curl",
     "hayleys-bmpc",
     "Fenobucarb (BMPC) is listed for chilli thrips and aphids that transmit Leaf Curl viruses — contact insecticide."),

    ("chilli", "blossom blight",
     "hayleys-mancozeb",
     "Mancozeb is listed for Chilli Blossom Blight — broad-spectrum protectant fungicide."),

    # ── Tea ───────────────────────────────────────────────────────────────
    ("tea", "blister blight",
     "hayleys-hexaconazole",
     "Hexaconazole is explicitly listed for Tea Blister Blight (Exobasidium vexans) — systemic triazole with curative action."),

    ("tea", "blister blight",
     "folicur-tebuconazole",
     "Tebuconazole is listed for Tea Blister Blight — systemic triazole with only 7-day pre-harvest interval."),

    ("tea", "blister",
     "hayleys-hexaconazole",
     "Hexaconazole is listed for Tea Blister Blight — systemic triazole."),

    ("tea", "red root",
     "hayleys-hexaconazole",
     "Hexaconazole is explicitly listed for Tea Redroot Disease — systemic triazole."),

    ("tea", "nematode",
     "velum-prime",
     "Velum Prime (Flopyram) is explicitly listed for tea nematodes — systemic nematicide controlling Pratylenchus loosi."),

    ("tea", "pratylenchus",
     "velum-prime",
     "Velum Prime (Flopyram) is explicitly listed for Pratylenchus loosi in tea — applied at planting and post-pruning."),

    # ── Banana ────────────────────────────────────────────────────────────
    ("banana", "sigatoka",
     "folicur-tebuconazole",
     "Tebuconazole is explicitly listed for Banana Sigatoka (including Black Sigatoka, Mycosphaerella fijiensis) — systemic triazole with proven efficacy."),

    # ── Cassava ───────────────────────────────────────────────────────────
    ("cassava", "mosaic",
     "admire-imidacloprid",
     "Imidacloprid (systemic neonicotinoid) is the primary control for Bemisia tabaci, the whitefly vector of Cassava Mosaic Virus — listed for thrips, aphids, and sucking pests on multiple crops."),

    ("cassava", "whitefly",
     "admire-imidacloprid",
     "Imidacloprid controls sucking insects including Bemisia tabaci (cassava whitefly) — systemic neonicotinoid listed for sucking pest control."),

    # ── Cross-crop (generic keywords) ─────────────────────────────────────
    (None, "angular leaf spot",
     "hayleys-hexaconazole",
     "Hexaconazole is listed for Bean Angular Leaf Spot — systemic triazole fungicide."),

    (None, "angular leaf spot",
     "folicur-tebuconazole",
     "Tebuconazole is listed for Angular Leaf Spot on beans — broad-spectrum systemic fungicide."),

    (None, "powdery mildew",
     "nativo-75-wg",
     "Nativo (Trifloxystrobin + Tebuconazole) is listed for Cucurbit Powdery Mildew — broad-spectrum systemic and mesostemic action."),

    (None, "alternaria blight",
     "hayleys-mancozeb",
     "Mancozeb is listed for Alternaria Blight across multiple crops including onion, carrot, and crucifers."),

    (None, "alternaria blight",
     "antracol-propineb",
     "Propineb (Antracol) is listed for Alternaria Blight across multiple crops."),

    (None, "white root",
     "hayleys-hexaconazole",
     "Hexaconazole is listed for White Root Disease in rubber — systemic triazole."),

    (None, "root-knot nematode",
     "velum-prime",
     "Velum Prime (Flopyram) is listed for root-knot nematodes (Meloidogyne spp.) in guava."),
]


def lookup(crop_type: str, disease_name: str) -> list[dict]:
    """Return a list of matched Hayleys product dicts (with injected 'why' key).

    Returns at most 2 products, ordered by rule specificity (crop-specific rules
    appear before generic ones in _RULES). Returns [] when no product genuinely
    covers this disease — no fabrication.
    """
    if not disease_name or not crop_type:
        return []

    crop_lower = crop_type.lower().strip()
    disease_lower = disease_name.lower().strip()

    # "Unable to Diagnose" / "Unknown" — no lookup possible
    if "unable" in disease_lower or "unknown" in disease_lower:
        return []

    matched_ids: list[str] = []
    matched_whys: dict[str, str] = {}

    for crop_kw, disease_kw, product_id, why in _RULES:
        if crop_kw is not None and crop_kw not in crop_lower:
            continue
        if disease_kw not in disease_lower:
            continue
        if product_id not in matched_ids and product_id in _PRODUCTS:
            matched_ids.append(product_id)
            matched_whys[product_id] = why

    results = []
    for pid in matched_ids[:2]:
        product = dict(_PRODUCTS[pid])
        product["why"] = matched_whys[pid]
        results.append(product)

    return results
