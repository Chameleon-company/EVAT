import re
import logging
from typing import Dict, Tuple, Optional, List
from fuzzywuzzy import fuzz, process

logger = logging.getLogger(__name__)

# Common synonyms / abbreviations
LOCATION_SYNONYMS = {
    "mel": "melbourne",
    "melboune": "melbourne",
    "rich": "richmond",
    "carl": "carlton"
}

ABBREVIATIONS = {
    "st": "street",
    "rd": "road",
    "ave": "avenue",
    "blvd": "boulevard",
}

def normalize_location_name(location: str) -> str:
    """Clean and normalize a location string."""
    if not location:
        return ""
    loc = location.lower().strip()
    loc = re.sub(r'[^a-z0-9\s\-]', ' ', loc)
    loc = re.sub(r'\s+', ' ', loc).strip()
    tokens = [ABBREVIATIONS.get(t, t) for t in loc.split()]
    loc = " ".join(tokens)
    return LOCATION_SYNONYMS.get(loc, loc)

def fuzzy_match_location(input_location: str,
                         available_locations: List[str],
                         threshold: int = 70) -> Optional[str]:
    """Find closest matching location using fuzzy logic."""
    if not input_location or not available_locations:
        return None
    norm_input = normalize_location_name(input_location)

    if norm_input in available_locations:
        return norm_input

    best = process.extractOne(norm_input, available_locations, scorer=fuzz.token_sort_ratio)
    if not best:
        return None
    match, score = best
    if score >= threshold:
        logger.info("Fuzzy matched '%s' -> '%s' (score=%s)", input_location, match, score)
        return match
    return None

def get_location_coordinates(location_name: str,
                             location_db: Dict[str, Tuple[float, float]],
                             threshold: int = 70) -> Optional[Tuple[float, float]]:
    """Return coordinates from DB, using normalization + fuzzy matching."""
    if not location_name or not location_db:
        return None

    normalized_map = { normalize_location_name(k): k for k in location_db.keys() }
    available = list(normalized_map.keys())

    matched_norm = fuzzy_match_location(location_name, available, threshold=threshold)
    if matched_norm:
        return location_db[normalized_map[matched_norm]]

    norm = normalize_location_name(location_name)
    if norm in normalized_map:
        return location_db[normalized_map[norm]]

    for k in location_db:
        if k.lower() == location_name.lower():
            return location_db[k]

    logger.info("Location not found: '%s'", location_name)
    return None
