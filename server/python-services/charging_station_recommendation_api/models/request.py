"""Pydantic models accepted by the recommendation API."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChargingStationCandidate(BaseModel):
    """A flat, enriched candidate supplied by the Node API."""

    stationId: str
    latitude: float
    longitude: float
    operator: Optional[str] = None
    connectionType: Optional[str] = None
    currentType: Optional[str] = None
    chargingPoints: Optional[int] = None
    cost: Optional[str] = None
    payAtLocation: Optional[str] = None
    membershipRequired: Optional[str] = None
    accessKeyRequired: Optional[str] = None
    isOperational: bool
    distanceKm: Optional[float] = None
    durationMin: Optional[float] = None
    durationInTrafficMin: Optional[float] = None
    roadTrafficCondition: Optional[str] = None
    energyNominalKwh: Optional[float] = None
    energyNeededKwh: Optional[float] = None
    socWithContingencyPct: Optional[float] = None
    temperatureC: Optional[float] = None
    windSpeedMs: Optional[float] = None
    windDirectionDeg: Optional[float] = None
    congestionLevel: Literal["low", "medium", "high", "unknown"] = "unknown"


class UserLocation(BaseModel):
    latitude: float
    longitude: float


class VehicleProfile(BaseModel):
    vehicleId: str
    make: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    fuelType: Optional[str] = None
    energyConsumptionWhkm: Optional[float] = None
    electricRangeKm: Optional[float] = None


class RecommendationSelection(BaseModel):
    stationId: Optional[str] = None
    selectedAt: Optional[datetime] = None


class RecommendationHistoryCandidate(ChargingStationCandidate):
    """A ranked candidate snapshot saved in recommendation history."""

    rank: int
    score: float
    reasons: List[str]


class RecommendationHistorySession(BaseModel):
    """A generated recommendation session saved for preference training."""

    candidates: List[RecommendationHistoryCandidate]
    selection: RecommendationSelection


class UserProfile(BaseModel):
    vehicle: VehicleProfile
    favouriteStationIds: List[str] = Field(default_factory=list)
    userHistory: List[RecommendationHistorySession] = Field(default_factory=list)


class RankChargingStationsRequest(BaseModel):
    """Input assembled by the Node API orchestration layer."""

    userId: str
    userLocation: UserLocation
    userProfile: UserProfile
    candidates: List[ChargingStationCandidate] = Field(min_length=1, max_length=10)
