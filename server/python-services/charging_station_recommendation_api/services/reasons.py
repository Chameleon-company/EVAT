"""Short explanations for ranked charging-station recommendations."""

from typing import Dict, List

from charging_station_recommendation_api.models.request import ChargingStationCandidate
from charging_station_recommendation_api.services.scoring import WEIGHTS


def build_reasons(
    candidate: ChargingStationCandidate,
    factor_scores: Dict[str, float],
) -> List[str]:
    """Return the strongest positive signals for one candidate."""

    reason_candidates = []
    if candidate.congestionLevel == "low":
        reason_candidates.append((WEIGHTS["congestion"], "Low station congestion"))
    if factor_scores["energy"] >= 0.75:
        reason_candidates.append((WEIGHTS["energy"], "Low energy required to reach"))
    if factor_scores["distance"] >= 0.75:
        reason_candidates.append((WEIGHTS["distance"], "Nearby station"))
    if factor_scores["traffic_duration"] >= 0.75:
        reason_candidates.append(
            (WEIGHTS["traffic_duration"], "Lower traffic-adjusted travel time")
        )
    if factor_scores["favourite"] == 1.0:
        reason_candidates.append((WEIGHTS["favourite"], "Favourite station"))

    reason_candidates.sort(key=lambda item: -item[0])
    reasons = [reason for _, reason in reason_candidates[:3]]
    return reasons or ["Balanced recommendation factors"]
