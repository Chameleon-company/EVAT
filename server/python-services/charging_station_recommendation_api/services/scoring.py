"""Fixed-weight scoring helpers for charging-station candidates."""

import re
from statistics import median
from typing import Dict, List, Optional

from models.request import ChargingStationCandidate


# Initial transparent ranking weights. A learned model can replace these later
# without changing the API request or response contract.
WEIGHTS = {
    "congestion": 0.25,
    "distance": 0.20,
    "energy": 0.20,
    "traffic_duration": 0.15,
    "duration": 0.10,
    "charging_points": 0.04,
    "cost": 0.03,
    "pay_at_location": 0.02,
    "favourite": 0.01,
}

CONGESTION_SCORES = {
    "low": 1.0,
    "medium": 0.5,
    "high": 0.0,
    "unknown": 0.5,
}


def score_candidates(
    candidates: List[ChargingStationCandidate],
    favourite_station_ids: List[str],
) -> List[Dict[str, object]]:
    """Return each candidate with its total score and individual factors."""

    distance_scores = _lower_is_better([candidate.distanceKm for candidate in candidates])
    energy_scores = _lower_is_better(
        [candidate.energyNeededKwh for candidate in candidates]
    )
    traffic_duration_scores = _lower_is_better(
        [
            candidate.durationInTrafficMin
            if candidate.durationInTrafficMin is not None
            else candidate.durationMin
            for candidate in candidates
        ]
    )
    duration_scores = _lower_is_better([candidate.durationMin for candidate in candidates])
    charging_point_scores = _higher_is_better(
        [candidate.chargingPoints for candidate in candidates]
    )
    cost_scores = _lower_is_better([_parse_cost(candidate.cost) for candidate in candidates])

    scored_candidates = []
    for index, candidate in enumerate(candidates):
        factor_scores = {
            "congestion": CONGESTION_SCORES[candidate.congestionLevel],
            "distance": distance_scores[index],
            "energy": energy_scores[index],
            "traffic_duration": traffic_duration_scores[index],
            "duration": duration_scores[index],
            "charging_points": charging_point_scores[index],
            "cost": cost_scores[index],
            "pay_at_location": _pay_at_location_score(candidate.payAtLocation),
            "favourite": float(candidate.stationId in favourite_station_ids),
        }
        score = sum(WEIGHTS[name] * value for name, value in factor_scores.items())
        scored_candidates.append(
            {
                "candidate": candidate,
                "score": score * 100,
                "factor_scores": factor_scores,
            }
        )

    return scored_candidates


def _lower_is_better(values: List[Optional[float]]) -> List[float]:
    """Normalise values so lower values receive higher scores."""

    known_values = [value for value in values if value is not None]
    if not known_values:
        return [0.5] * len(values)

    low, high = min(known_values), max(known_values)
    fallback = median(known_values)
    if low == high:
        return [1.0 if value is not None else 0.5 for value in values]

    return [
        (high - (value if value is not None else fallback)) / (high - low)
        for value in values
    ]


def _higher_is_better(values: List[Optional[int]]) -> List[float]:
    """Normalise values so higher values receive higher scores."""

    known_values = [value for value in values if value is not None]
    if not known_values:
        return [0.5] * len(values)

    low, high = min(known_values), max(known_values)
    fallback = median(known_values)
    if low == high:
        return [1.0 if value is not None else 0.5 for value in values]

    return [
        ((value if value is not None else fallback) - low) / (high - low)
        for value in values
    ]


def _parse_cost(cost: Optional[str]) -> Optional[float]:
    """Extract the first numeric price from existing station cost text."""

    if not cost:
        return None

    match = re.search(r"\d+(?:\.\d+)?", cost)
    return float(match.group()) if match else None


def _pay_at_location_score(pay_at_location: Optional[str]) -> float:
    if pay_at_location is None:
        return 0.5
    value = pay_at_location.strip().lower()
    if value == "unknown":
        return 0.5
    return 1.0 if value == "yes" else 0.0
