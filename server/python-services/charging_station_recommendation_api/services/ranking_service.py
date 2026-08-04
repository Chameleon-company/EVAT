"""Orchestrates scoring, sorting, and response creation."""

from typing import List

from models.request import ChargingStationCandidate
from models.response import ChargingStationRecommendation
from services.reasons import build_reasons
from services.scoring import score_candidates


def rank_candidates(
    candidates: List[ChargingStationCandidate],
    favourite_station_ids: List[str],
) -> List[ChargingStationRecommendation]:
    """Score eligible candidates and return them in descending rank order."""

    # No eligible station means there is nothing to rank.
    if not candidates:
        return []

    # Calculate one total score and factor breakdown for every candidate.
    scored_candidates = score_candidates(candidates, favourite_station_ids)

    # Put the highest score first. stationId makes ties deterministic.
    scored_candidates.sort(
        key=lambda item: (-item["score"], item["candidate"].stationId)
    )

    # Turn the sorted scores into the API response with ranks and explanations.
    return [
        ChargingStationRecommendation(
            stationId=item["candidate"].stationId,
            rank=rank,
            score=round(item["score"], 1),
            reasons=build_reasons(item["candidate"], item["factor_scores"]),
        )
        for rank, item in enumerate(scored_candidates, start=1)
    ]
