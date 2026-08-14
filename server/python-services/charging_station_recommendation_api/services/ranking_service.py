"""Orchestrates scoring, sorting, and response creation."""

from typing import List

from charging_station_recommendation_api.models.request import ChargingStationCandidate
from charging_station_recommendation_api.models.response import ChargingStationRecommendation
from charging_station_recommendation_api.services.preference_model import (
    predict_selection_probability,
)
from charging_station_recommendation_api.services.reasons import build_reasons
from charging_station_recommendation_api.services.scoring import score_candidates


def rank_candidates(
    candidates: List[ChargingStationCandidate],
    favourite_station_ids: List[str],
) -> List[ChargingStationRecommendation]:
    """Score eligible candidates and return them in descending rank order."""

    # No eligible station means there is nothing to rank.
    if not candidates:
        return []

    # Calculate the fixed-weight heuristic score and factor breakdown for
    # every candidate. The factor breakdown is always used to build the
    # human-readable "reasons" below, since the trained model doesn't
    # produce per-factor explanations on its own.
    scored_candidates = score_candidates(candidates, favourite_station_ids)

    # If a trained personalised-preference model has been exported (see
    # training/train_preference_model.py), use its predicted selection
    # probability as the ranking score instead of the fixed weights. Falls
    # back to the heuristic score automatically if no model is available.
    probabilities = predict_selection_probability(candidates)
    if probabilities is not None:
        for item, probability in zip(scored_candidates, probabilities):
            item["score"] = probability * 100

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