"""Orchestrates scoring, sorting, and response creation."""

from typing import List, Optional

from charging_station_recommendation_api.models.request import (
    ChargingStationCandidate,
    RecommendationHistorySession,
)
from charging_station_recommendation_api.models.response import (
    ChargingStationRecommendation,
)
from charging_station_recommendation_api.services.personalization import (
    apply_personalization,
)
from charging_station_recommendation_api.services.preference_model import (
    predict_selection_probability,
)
from charging_station_recommendation_api.services.reasons import build_reasons
from charging_station_recommendation_api.services.scoring import score_candidates


def rank_candidates(
    candidates: List[ChargingStationCandidate],
    favourite_station_ids: List[str],
    user_history: Optional[List[RecommendationHistorySession]] = None,
) -> List[ChargingStationRecommendation]:
    """Score eligible candidates and return them in descending rank order."""

    if not candidates:
        return []

    scored_candidates = score_candidates(
        candidates,
        favourite_station_ids,
    )

    user_previous_sessions = sum(
        1
        for session in (user_history or [])
        if session.selection.stationId is not None
    )

    probabilities = predict_selection_probability(
        candidates,
        user_previous_sessions,
    )

    if probabilities is not None:
        for item, probability in zip(
            scored_candidates,
            probabilities,
        ):
            item["score"] = probability * 100

    apply_personalization(
        scored_candidates,
        user_history or [],
    )

    scored_candidates.sort(
        key=lambda item: (
            -item["score"],
            item["candidate"].stationId,
        )
    )

    return [
        ChargingStationRecommendation(
            stationId=item["candidate"].stationId,
            rank=rank,
            score=round(item["score"], 1),
            reasons=build_reasons(
                item["candidate"],
                item["factor_scores"],
            ),
        )
        for rank, item in enumerate(
            scored_candidates,
            start=1,
        )
    ]