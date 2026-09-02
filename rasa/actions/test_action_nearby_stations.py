"""
Regression test for the ActionNearbyStations bug fix.

Previously, ActionNearbyStations called data_service.get_emergency_stations_from_coordinates()
instead of data_service.get_nearby_stations(), meaning general "find chargers near me"
requests were served with the emergency-charging radius/result-limit (15km, 5 results)
instead of the intended general search (8km, 20 results). This test locks in the fix.
"""

from unittest.mock import MagicMock, patch

from actions.actions import ActionNearbyStations


def _make_tracker(current_location=None, user_lat=None, user_lng=None):
    tracker = MagicMock()
    slots = {
        "current_location": current_location,
        "user_lat": user_lat,
        "user_lng": user_lng,
    }
    tracker.get_slot.side_effect = lambda slot: slots.get(slot)
    tracker.latest_message = {"entities": []}
    return tracker


@patch("actions.actions.data_service")
def test_uses_get_nearby_stations_not_emergency_method_for_named_location(mock_data_service):
    mock_data_service._get_location_coordinates.return_value = (-37.8136, 144.9631)
    mock_data_service.get_nearby_stations.return_value = [
        {"name": "Station A", "distance_km": 1.0}
    ]

    action = ActionNearbyStations()
    dispatcher = MagicMock()
    tracker = _make_tracker(current_location="Melbourne")

    action.run(dispatcher, tracker, {})

    mock_data_service.get_nearby_stations.assert_called_once_with((-37.8136, 144.9631))
    mock_data_service.get_emergency_stations_from_coordinates.assert_not_called()


@patch("actions.actions.data_service")
def test_uses_get_nearby_stations_not_emergency_method_for_raw_coordinates(mock_data_service):
    mock_data_service.get_nearby_stations.return_value = [
        {"name": "Station B", "distance_km": 2.0}
    ]

    action = ActionNearbyStations()
    dispatcher = MagicMock()
    tracker = _make_tracker(user_lat=-37.8136, user_lng=144.9631)

    action.run(dispatcher, tracker, {})

    mock_data_service.get_nearby_stations.assert_called_once_with((-37.8136, 144.9631))
    mock_data_service.get_emergency_stations_from_coordinates.assert_not_called()


@patch("actions.actions.data_service")
def test_no_stations_found_returns_helpful_message(mock_data_service):
    mock_data_service._get_location_coordinates.return_value = (-37.8136, 144.9631)
    mock_data_service.get_nearby_stations.return_value = []

    action = ActionNearbyStations()
    dispatcher = MagicMock()
    tracker = _make_tracker(current_location="Nowhereville")

    events = action.run(dispatcher, tracker, {})

    assert events == []
    dispatcher.utter_message.assert_called_once()
    _, kwargs = dispatcher.utter_message.call_args
    assert "couldn't find" in kwargs["text"].lower()
