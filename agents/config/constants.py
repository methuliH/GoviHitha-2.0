"""Static constants: Sri Lankan region coordinates and crop lists."""

# All 25 districts listed in frontend/src/lib/constants.ts REGIONS
# Coordinates: (latitude, longitude)
REGION_COORDINATES: dict[str, tuple[float, float]] = {
    "Colombo":      (6.9271,  79.8612),
    "Gampaha":      (7.0917,  79.9995),
    "Kalutara":     (6.5854,  79.9607),
    "Kandy":        (7.2906,  80.6337),
    "Matale":       (7.4675,  80.6234),
    "Nuwara Eliya": (6.9497,  80.7891),
    "Galle":        (6.0535,  80.2210),
    "Matara":       (5.9549,  80.5550),
    "Hambantota":   (6.1241,  81.1185),
    "Jaffna":       (9.6615,  80.0255),
    "Kilinochchi":  (9.3803,  80.3770),
    "Mannar":       (8.9810,  79.9044),
    "Vavuniya":     (8.7514,  80.4971),
    "Mullaitivu":   (9.2671,  80.8142),
    "Batticaloa":   (7.7170,  81.6924),
    "Ampara":       (7.2975,  81.6747),
    "Trincomalee":  (8.5874,  81.2152),
    "Kurunegala":   (7.4818,  80.3609),
    "Puttalam":     (8.0362,  79.8283),
    "Anuradhapura": (8.3114,  80.4037),
    "Polonnaruwa":  (7.9403,  81.0188),
    "Badulla":      (6.9934,  81.0550),
    "Monaragala":   (6.8714,  81.3507),
    "Ratnapura":    (6.6828,  80.3992),
    "Kegalle":      (7.2513,  80.3464),
}

# Fallback centre of Sri Lanka when region is unknown
DEFAULT_COORDINATES: tuple[float, float] = (7.8731, 80.7718)

CROP_TYPES: list[str] = [
    "rice", "corn", "tea", "coconut", "banana",
    "cassava", "pepper", "chilli", "tomato", "potato",
]
