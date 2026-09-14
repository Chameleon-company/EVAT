import re
from typing import Optional

LOCATION_KEYWORDS = [
    "where", "location", "address", "coordinates", "place", "near", "nearby",
    "locate", "how do i get", "find"
]

def is_location_query(user_input: str) -> bool:
    """Check if user query looks like a location request."""
    if not user_input:
        return False
    text = user_input.lower()
    for kw in LOCATION_KEYWORDS:
        if kw in text:
            return True
    if len(text.split()) <= 3:
        return True
    return False

def extract_location_from_message(user_input: str) -> Optional[str]:
    """Try to pull a location name out of a message."""
    if not user_input:
        return None
    text = user_input.strip()
    m = re.search(r'\b(?:in|at|near|to|around)\s+([a-z0-9\s\-\']+)', text, flags=re.I)
    if m:
        return m.group(1).strip()
    if len(text.split()) <= 3:
        return text
    return None
