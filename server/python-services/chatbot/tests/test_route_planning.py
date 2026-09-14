from unittest.mock import patch

from chatbot.services.route_planning import get_stations_along_route


@patch("chatbot.services.route_planning.get_charging_stations")
def test_route_corridor_excludes_station_away_from_path(mock_get_stations):
    on_route = {
        "name": "On Route",
        "latitude": 0.0,
        "longitude": 0.05,
    }
    far_from_route = {
        "name": "Wrong Direction",
        "latitude": 0.04,
        "longitude": 0.05,
    }
    mock_get_stations.return_value = ([on_route, far_from_route], None)

    stations, candidates = get_stations_along_route(
        start_coords=(0.0, 0.0),
        end_coords=(0.0, 0.1),
        route_distance=11.1,
        route_info={"polyline": [(0.0, 0.0), (0.0, 0.1)]},
        route_radius_km=2.0,
        max_results=5,
        earth_radius_km=6371,
    )

    assert [station["name"] for station in stations] == ["On Route"]
    assert [station["name"] for station in candidates] == ["On Route"]
    assert stations[0]["distance_from_route_km"] == 0.0

