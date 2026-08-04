from models.request import ChargingStationCandidate
from services.candidate_filters import filter_eligible_candidates


def candidate(**overrides):
    values = {
        "stationId": "station-1",
        "latitude": -37.8136,
        "longitude": 144.9631,
        "isOperational": True,
        "chargingPoints": 2,
        "distanceKm": 2.0,
        "socWithContingencyPct": 5.0,
    }
    values.update(overrides)
    return ChargingStationCandidate(**values)


def test_filters_out_closed_zero_point_and_unreachable_stations():
    eligible = candidate(stationId="eligible", chargingPoints=None)
    candidates = [
        eligible,
        candidate(stationId="closed", isOperational=False),
        candidate(stationId="no-points", chargingPoints=0),
        candidate(stationId="unreachable", socWithContingencyPct=11.0),
    ]

    result = filter_eligible_candidates(candidates)

    assert [station.stationId for station in result] == ["eligible"]
