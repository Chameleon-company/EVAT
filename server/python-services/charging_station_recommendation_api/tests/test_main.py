from fastapi import FastAPI
from fastapi.testclient import TestClient

from charging_station_recommendation_api.main import rank_charging_stations
from charging_station_recommendation_api.models.request import (
    RankChargingStationsRequest,
)
from charging_station_recommendation_api.models.response import (
    RankChargingStationsResponse,
)


app = FastAPI()


@app.post(
    "/charging-station-recommendations/rank",
    response_model=RankChargingStationsResponse,
)
def rank(request: RankChargingStationsRequest):
    return rank_charging_stations(request)


client = TestClient(app)


def test_rank_endpoint_returns_ranked_recommendations():
    request_body = {
        "userId": "user-1",
        "userLocation": {
            "latitude": -37.8136,
            "longitude": 144.9631,
        },
        "userProfile": {
            "vehicle": {"vehicleId": "vehicle-1"},
            "favouriteStationIds": [],
            "userHistory": [],
        },
        "candidates": [
            {
                "stationId": "station-1",
                "latitude": -37.8136,
                "longitude": 144.9631,
                "isOperational": True,
                "chargingPoints": 2,
                "distanceKm": 2.0,
                "socWithContingencyPct": 5.0,
                "congestionLevel": "low",
            }
        ],
    }

    response = client.post(
        "/charging-station-recommendations/rank",
        json=request_body,
    )

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["stationId"] == "station-1"
    assert response.json()["recommendations"][0]["rank"] == 1


def test_rank_endpoint_accepts_unknown_routing_data():
    request_body = {
        "userId": "user-1",
        "userLocation": {
            "latitude": -37.8136,
            "longitude": 144.9631,
        },
        "userProfile": {
            "vehicle": {"vehicleId": "vehicle-1"},
            "favouriteStationIds": [],
            "userHistory": [],
        },
        "candidates": [
            {
                "stationId": "station-unknown-route",
                "latitude": -37.8136,
                "longitude": 144.9631,
                "isOperational": True,
                "chargingPoints": 2,
                "distanceKm": None,
                "socWithContingencyPct": None,
                "congestionLevel": "unknown",
            }
        ],
    }

    response = client.post(
        "/charging-station-recommendations/rank",
        json=request_body,
    )

    assert response.status_code == 200
    assert (
        response.json()["recommendations"][0]["stationId"]
        == "station-unknown-route"
    )