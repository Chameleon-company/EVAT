"""Pydantic models returned by the recommendation API."""

from typing import List

from pydantic import BaseModel


class ChargingStationRecommendation(BaseModel):
    stationId: str
    rank: int
    score: float
    reasons: List[str]


class RankChargingStationsResponse(BaseModel):
    recommendations: List[ChargingStationRecommendation]
