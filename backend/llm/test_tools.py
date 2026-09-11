"""
Unit tests for the get_nearby_stations Qwen tool in backend/llm/tools.py.

There was previously no pytest coverage at all for backend/llm/tools.py
(the existing backend/llm/test_llm.py is a manual smoke-test script that
needs a live Ollama instance). These tests cover the new tool in isolation
with mocks, the same way backend/test_nearby_stations_service.py covers the
service it wraps.
"""

from unittest.mock import patch

import pytest

from backend.llm.tools import execute_tool_call


@patch("backend.llm.tools.api_manager")
@patch("backend.llm.tools.get_nearby_stations")
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


@patch("backend.llm.tools.api_manager")
@patch("backend.llm.tools.get_nearby_stations")
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


@patch("backend.llm.tools.get_nearby_stations")
def test_get_nearby_stations_rejects_invalid_coordinates(mock_get_nearby_stations):
    with pytest.raises(ValueError):
        execute_tool_call(
            "get_nearby_stations",
            {"latitude": "not-a-number", "longitude": 144.9631},
        )

    mock_get_nearby_stations.assert_not_called()


@patch("backend.llm.tools.get_nearby_stations")
def test_get_nearby_stations_rejects_invalid_limit(mock_get_nearby_stations):
    with pytest.raises(ValueError):
        execute_tool_call(
            "get_nearby_stations",
            {"latitude": -37.8136, "longitude": 144.9631, "limit": 0},
        )

    mock_get_nearby_stations.assert_not_called()
