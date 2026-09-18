from charging_station_recommendation_api.models.request import (
    ChargingStationCandidate,
)
from charging_station_recommendation_api.services.preference_model import (
    _candidate_to_row,
)


def test_candidate_row_includes_user_previous_sessions():
    candidate = ChargingStationCandidate(
        stationId="station-1",
        latitude=-37.8136,
        longitude=144.9631,
        isOperational=True,
        distanceKm=2.0,
        durationMin=5.0,
        durationInTrafficMin=6.0,
        energyNeededKwh=1.0,
        chargingPoints=2,
        temperatureC=20.0,
        windSpeedMs=3.0,
        roadTrafficCondition="moderate",
        payAtLocation="yes",
        operator="test-operator",
    )

    row = _candidate_to_row(
        candidate,
        user_previous_sessions=4,
    )

    assert row["userPreviousSessions"] == 4.0


def test_model_handles_unknown_and_missing_categories():
    candidate = ChargingStationCandidate(
        stationId="station-2",
        latitude=-37.8136,
        longitude=144.9631,
        isOperational=True,
        distanceKm=3.0,
        durationMin=7.0,
        durationInTrafficMin=9.0,
        energyNeededKwh=2.0,
        chargingPoints=2,
        temperatureC=None,
        windSpeedMs=None,
        roadTrafficCondition="brand-new-category",
        payAtLocation=None,
        operator="never-seen-operator",
    )

    row = _candidate_to_row(
        candidate,
        user_previous_sessions=2,
    )

    assert row["roadTrafficCondition"] == "brand-new-category"
    assert row["payAtLocation"] == "unknown"
    assert row["operator"] == "never-seen-operator"