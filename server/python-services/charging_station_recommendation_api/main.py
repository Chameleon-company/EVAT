"""Charging Station Recommendation API.

The Node API supplies enriched station candidates to this service. Ranking logic
will be added incrementally after the request contract is agreed by the team.
"""

from charging_station_recommendation_api.models.request import RankChargingStationsRequest
from charging_station_recommendation_api.models.response import RankChargingStationsResponse
from charging_station_recommendation_api.services.candidate_filters import filter_eligible_candidates
from charging_station_recommendation_api.services.ranking_service import rank_candidates

def rank_charging_stations(
    request: RankChargingStationsRequest,
) -> RankChargingStationsResponse:
    """Return ranked stations once filtering and scoring are implemented."""

    eligible_candidates = filter_eligible_candidates(request.candidates)

    recommendations = rank_candidates(
        eligible_candidates,
        request.userProfile.favouriteStationIds,
        request.userProfile.userHistory,
    )
    return RankChargingStationsResponse(recommendations=recommendations)
