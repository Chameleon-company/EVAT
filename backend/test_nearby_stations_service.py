from unittest.mock import patch

from backend.nearby_stations_service import get_nearby_stations


@patch("backend.nearby_stations_service.get_charging_stations")
def test_delegates_to_get_charging_stations_with_correct_args(mock_get_stations):
    mock_get_stations.return_value = ([{"name": "Test Station"}], "Open Charge Map API")

    result = get_nearby_stations(latitude=-37.8136, longitude=144.9631, radius_km=8.0, limit=20)

    mock_get_stations.assert_called_once_with(
        latitude=-37.8136,
        longitude=144.9631,
        distance_km=8.0,
        limit=20,
    )
    assert result == [{"name": "Test Station"}]


@patch("backend.nearby_stations_service.get_charging_stations")
def test_uses_default_radius_and_limit_when_not_specified(mock_get_stations):
    mock_get_stations.return_value = ([], "CSV Backup")

    get_nearby_stations(latitude=-37.8, longitude=144.9)

    _, kwargs = mock_get_stations.call_args
    assert kwargs["distance_km"] == 8.0
    assert kwargs["limit"] == 20


@patch("backend.nearby_stations_service.get_charging_stations")
def test_coerces_string_coordinates_to_float(mock_get_stations):
    mock_get_stations.return_value = ([], "CSV Backup")

    get_nearby_stations(latitude="-37.8136", longitude="144.9631")

    _, kwargs = mock_get_stations.call_args
    assert kwargs["latitude"] == -37.8136
    assert kwargs["longitude"] == 144.9631
    assert isinstance(kwargs["latitude"], float)
    assert isinstance(kwargs["longitude"], float)


@patch("backend.nearby_stations_service.get_charging_stations")
def test_returns_empty_list_when_no_stations_found(mock_get_stations):
    mock_get_stations.return_value = ([], "CSV Backup")

    result = get_nearby_stations(latitude=-37.8, longitude=144.9)

    assert result == []
