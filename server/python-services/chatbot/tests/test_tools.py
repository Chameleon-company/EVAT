"""
Unit tests for the get_nearby_stations Qwen tool in chatbot/llm/tools.py.

There was previously no pytest coverage at all for chatbot/llm/tools.py
(the existing tests/manual_llm_smoke.py is a manual smoke-test script that
needs a live Ollama instance). These tests cover the new tool in isolation
with mocks, the same way tests/test_nearby_stations.py covers the
service it wraps.
"""

from unittest.mock import patch

import pytest

from chatbot.llm.tools import execute_tool_call


@patch("chatbot.llm.tools.api_manager")
@patch("chatbot.llm.tools.get_nearby_stations")
def test_get_nearby_stations_returns_station_cards(mock_get_nearby_stations, mock_api_manager):
    mock_get_nearby_stations.return_value = [
        {"name": "Station A", "latitude": -37.81, "longitude": 144.96, "distance_km": 1.2},
        {"name": "Station B", "latitude": -37.82, "longitude": 144.95, "distance_km": 2.4},
    ]
    mock_api_manager.get_real_time_route.return_value = None

    result = execute_tool_call(
        "get_nearby_stations",
        {"latitude": -37.8136, "longitude": 144.9631},
    )

    _, kwargs = mock_get_nearby_stations.call_args
    assert kwargs["latitude"] == -37.8136
    assert kwargs["longitude"] == 144.9631

    assert result["type"] == "stations"
    assert result["show_availability"] is True
    assert result["count"] == 2
    assert len(result["stations"]) == 2
    assert result["stations"][0]["origin_latitude"] == -37.8136
    assert result["stations"][0]["origin_longitude"] == 144.9631


@patch("chatbot.llm.tools.api_manager")
@patch("chatbot.llm.tools.get_nearby_stations")
def test_get_nearby_stations_respects_limit(mock_get_nearby_stations, mock_api_manager):
    mock_get_nearby_stations.return_value = [
        {"name": f"Station {i}", "latitude": -37.8, "longitude": 144.9} for i in range(10)
    ]
    mock_api_manager.get_real_time_route.return_value = None

    result = execute_tool_call(
        "get_nearby_stations",
        {"latitude": -37.8136, "longitude": 144.9631, "limit": 3},
    )

    assert result["count"] == 3
    assert len(result["stations"]) == 3


@patch("chatbot.llm.tools.get_nearby_stations")
def test_get_nearby_stations_rejects_invalid_coordinates(mock_get_nearby_stations):
    with pytest.raises(ValueError):
        execute_tool_call(
            "get_nearby_stations",
            {"latitude": "not-a-number", "longitude": 144.9631},
        )

    mock_get_nearby_stations.assert_not_called()


@patch("chatbot.llm.tools.get_nearby_stations")
def test_get_nearby_stations_rejects_invalid_limit(mock_get_nearby_stations):
    with pytest.raises(ValueError):
        execute_tool_call(
            "get_nearby_stations",
            {"latitude": -37.8136, "longitude": 144.9631, "limit": 0},
        )

    mock_get_nearby_stations.assert_not_called()


@patch("chatbot.llm.tools.api_manager")
@patch("chatbot.llm.tools.get_nearby_stations")
def test_named_location_overrides_browser_coordinates(
    mock_get_nearby_stations,
    mock_api_manager,
):
    mock_api_manager.geocode_location.return_value = (-37.819, 145.122)
    mock_api_manager.get_real_time_route.return_value = None
    mock_get_nearby_stations.return_value = []

    result = execute_tool_call(
        "get_nearby_stations",
        {
            "location": "Box Hill VIC 3128",
            "latitude": -37.8784,
            "longitude": 145.1285,
        },
    )

    _, kwargs = mock_get_nearby_stations.call_args
    assert kwargs["latitude"] == -37.819
    assert kwargs["longitude"] == 145.122
    assert result["location"] == "Box Hill VIC 3128"


@patch("chatbot.llm.tools.api_manager")
@patch("chatbot.llm.tools.get_nearby_stations")
@patch("chatbot.llm.tools.get_location_coordinates", return_value=None)
def test_unresolved_named_location_is_rejected(
    mock_get_location_coordinates,
    mock_get_nearby_stations,
    mock_api_manager,
):
    mock_api_manager.geocode_location.return_value = None

    with pytest.raises(ValueError, match="Could not resolve location"):
        execute_tool_call(
            "get_nearby_stations",
            {"location": "Definitely Not A Real Place"},
        )

    mock_get_nearby_stations.assert_not_called()

