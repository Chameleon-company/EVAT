from charging_station_recommendation_api.models.request import ChargingStationCandidate
from charging_station_recommendation_api.services.ranking_service import rank_candidates


def candidate(**overrides):
    values = {
        "stationId": "station-1",
        "latitude": -37.8136,
        "longitude": 144.9631,
        "isOperational": True,
        "chargingPoints": 2,
        "distanceKm": 2.0,
        "durationMin": 5.0,
        "durationInTrafficMin": 6.0,
        "energyNeededKwh": 1.0,
        "socWithContingencyPct": 5.0,
        "congestionLevel": "low",
    }
    values.update(overrides)
    return ChargingStationCandidate(**values)


def test_ranks_stronger_candidate_first_and_returns_reasons():
    best = candidate(
        stationId="best",
        chargingPoints=4,
        distanceKm=1.0,
        durationMin=4.0,
        durationInTrafficMin=4.0,
        energyNeededKwh=0.5,
        congestionLevel="low",
    )
    weakest = candidate(
        stationId="weakest",
        chargingPoints=1,
        distanceKm=8.0,
        durationMin=20.0,
        durationInTrafficMin=25.0,
        energyNeededKwh=4.0,
        congestionLevel="high",
    )

    result = rank_candidates([weakest, best], favourite_station_ids=["best"])

    assert [station.stationId for station in result] == ["best", "weakest"]
    assert [station.rank for station in result] == [1, 2]
    assert "Low station congestion" in result[0].reasons


def test_returns_empty_list_when_no_candidates_are_eligible():
    assert rank_candidates([], favourite_station_ids=[]) == []


def test_missing_optional_values_do_not_stop_ranking():
    result = rank_candidates(
        [candidate(durationMin=None, durationInTrafficMin=None, energyNeededKwh=None)],
        favourite_station_ids=[],
    )

    assert result[0].stationId == "station-1"
    assert result[0].score >= 0
