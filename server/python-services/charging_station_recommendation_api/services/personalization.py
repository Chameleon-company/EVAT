
import re
from collections import Counter
from typing import List, Optional

from pydantic import BaseModel

from charging_station_recommendation_api.models.request import (
    ChargingStationCandidate,
    RecommendationHistorySession,
)

# How much the personalisation adjustment can move the final score, as a
# fraction of the blend. Deliberately small -- the global model/heuristic
# score still dominates; this only nudges the ranking toward the user's own
# pattern, it doesn't override it.
ADJUSTMENT_WEIGHT = 0.15

# Require at least this many past selections before trusting a preference
# profile. Below this, a user's history is too sparse/noisy to generalise
# from, so we skip personalisation rather than overfit to 1-2 data points.
MIN_SELECTIONS = 3

# Distance/cost/points differences at or beyond these values are treated as
# "no longer similar" for the purposes of the closeness score below.
DISTANCE_SCALE_KM = 15.0
COST_SCALE = 0.20
CHARGING_POINTS_SCALE = 6.0


class PreferenceProfile(BaseModel):
    avg_distance_km: Optional[float] = None
    avg_cost: Optional[float] = None
    avg_charging_points: Optional[float] = None
    preferred_operator: Optional[str] = None
    preferred_congestion: Optional[str] = None
    preferred_pay_at_location: Optional[str] = None
    sample_size: int


def _parse_cost(cost: Optional[str]) -> Optional[float]:
    if not cost:
        return None
    match = re.search(r"\d+(?:\.\d+)?", cost)
    return float(match.group()) if match else None


def _selected_candidates(
    history: List[RecommendationHistorySession],
) -> List[ChargingStationCandidate]:
    """Pull out the candidate the user actually chose from each session.

    A session the user didn't act on (no selection recorded) carries no
    preference signal, so it's skipped.
    """

    selected = []
    for session in history:
        station_id = session.selection.stationId
        if not station_id:
            continue
        for candidate in session.candidates:
            if candidate.stationId == station_id:
                selected.append(candidate)
                break
    return selected


def _mode(values: List[str]) -> Optional[str]:
    present = [value for value in values if value]
    if not present:
        return None
    return Counter(present).most_common(1)[0][0]


def _mean(values: List[Optional[float]]) -> Optional[float]:
    present = [value for value in values if value is not None]
    if not present:
        return None
    return sum(present) / len(present)


def build_preference_profile(
    history: List[RecommendationHistorySession],
) -> Optional[PreferenceProfile]:
    """Summarise a user's past selections into a lightweight preference profile.

    Returns None if there isn't enough selection history to build a
    trustworthy profile -- callers should treat that as "skip
    personalisation, use the global score as-is".
    """

    selected = _selected_candidates(history)
    if len(selected) < MIN_SELECTIONS:
        return None

    return PreferenceProfile(
        avg_distance_km=_mean([candidate.distanceKm for candidate in selected]),
        avg_cost=_mean([_parse_cost(candidate.cost) for candidate in selected]),
        avg_charging_points=_mean(
            [float(c.chargingPoints) if c.chargingPoints is not None else None for c in selected]
        ),
        preferred_operator=_mode([candidate.operator for candidate in selected]),
        preferred_congestion=_mode([candidate.congestionLevel for candidate in selected]),
        preferred_pay_at_location=_mode([candidate.payAtLocation for candidate in selected]),
        sample_size=len(selected),
    )


def _closeness(value: Optional[float], target: Optional[float], scale: float) -> float:
    """1.0 when value matches target exactly, decaying to 0.0 by `scale` away.

    Returns a neutral 0.5 if either side is unknown, since we can't say
    whether it matches or not.
    """

    if value is None or target is None:
        return 0.5
    diff = abs(value - target)
    return max(0.0, 1 - (diff / scale))


def _match(value: Optional[str], preferred: Optional[str]) -> float:
    if value is None or preferred is None:
        return 0.5
    return 1.0 if value == preferred else 0.0


def personalization_score(
    candidate: ChargingStationCandidate, profile: PreferenceProfile
) -> float:
    """How well this candidate matches the user's historical preferences, 0-1."""

    components = [
        _closeness(candidate.distanceKm, profile.avg_distance_km, DISTANCE_SCALE_KM),
        _closeness(_parse_cost(candidate.cost), profile.avg_cost, COST_SCALE),
        _closeness(
            float(candidate.chargingPoints) if candidate.chargingPoints is not None else None,
            profile.avg_charging_points,
            CHARGING_POINTS_SCALE,
        ),
        _match(candidate.operator, profile.preferred_operator),
        _match(candidate.congestionLevel, profile.preferred_congestion),
        _match(candidate.payAtLocation, profile.preferred_pay_at_location),
    ]
    return sum(components) / len(components)


def apply_personalization(
    scored_candidates: List[dict],
    history: List[RecommendationHistorySession],
) -> None:
    """Blend a per-user personalisation score into each candidate's score, in place.

    No-op if the user doesn't have enough history yet -- new/light users
    simply get the unmodified global ranking.
    """

    profile = build_preference_profile(history)
    if profile is None:
        return

    for item in scored_candidates:
        p_score = personalization_score(item["candidate"], profile) * 100
        item["score"] = item["score"] * (1 - ADJUSTMENT_WEIGHT) + p_score * ADJUSTMENT_WEIGHT
