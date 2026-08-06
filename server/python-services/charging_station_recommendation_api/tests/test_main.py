from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_endpoint_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_rank_endpoint_returns_ranked_recommendations():
    request_body = {
        "userId": "user-1",
        "userLocation": {"latitude": -37.8136, "longitude": 144.9631},
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

    response = client.post("/charging-station-recommendations/rank", json=request_body)

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["stationId"] == "station-1"
    assert response.json()["recommendations"][0]["rank"] == 1


def test_rank_endpoint_accepts_unknown_routing_data():
    request_body = {
        "userId": "user-1",
        "userLocation": {"latitude": -37.8136, "longitude": 144.9631},
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

    response = client.post("/charging-station-recommendations/rank", json=request_body)

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["stationId"] == "station-unknown-route"
