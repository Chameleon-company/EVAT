from typing import Any, Dict

from chatbot.services.availability import get_station_availability
from chatbot.config import (
    SEARCH_CONFIG,
    LOCATION_CONFIG,
    DATA_CONFIG,
    CHARGING_CONFIG,
)
from chatbot.services.station_details import get_station_details
from chatbot.services.route_planning import (
    get_route_stations as backend_get_route_stations,
)
from chatbot.services.location_resolution import get_location_coordinates
from chatbot.services.nearby_stations import get_nearby_stations
from chatbot.services.data_loader import load_datasets
from chatbot.services.station_preference import get_stations_by_preference
from chatbot.services.real_time_apis import api_manager

from chatbot.services.emergency_charging import (
    get_emergency_stations,
    infer_connector_from_message,
    filter_stations_by_connector,
)

EVAT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_station_availability",
            "description": (
                "Check live EV charging availability near a named location "
                "or the user's current coordinates."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {
                        "type": "number",
                        "description": "Latitude of the charging station.",
                    },
                    "lon": {
                        "type": "number",
                        "description": "Longitude of the charging station.",
                    },
                    "location": {
                        "type": "string",
                        "description": (
                            "Named suburb, postcode, or address. Use this "
                            "when the user names a place."
                        ),
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_nearby_stations",
            "description": (
                "Find EV charging stations near a named place or the user's "
                "current location for a general request, without filtering by "
                "preference. Use this for requests like 'find chargers "
                "near me'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "latitude": {
                        "type": "number",
                        "description": "User latitude.",
                    },
                    "longitude": {
                        "type": "number",
                        "description": "User longitude.",
                    },
                    "location": {
                        "type": "string",
                        "description": (
                            "Named suburb, postcode, or address. Use this "
                            "when the user names a place."
                        ),
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": (
                            "Maximum number of stations to return. "
                            "Defaults to 5."
                        ),
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stations_by_preference",
            "description": (
                "Find EV charging stations near a named place or current "
                "location and order them by the "
                "user's preference: closest, cheapest, or fastest."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "latitude": {
                        "type": "number",
                        "description": "User latitude.",
                    },
                    "longitude": {
                        "type": "number",
                        "description": "User longitude.",
                    },
                    "location": {
                        "type": "string",
                        "description": (
                            "Named suburb, postcode, or address. Use this "
                            "when the user names a place."
                        ),
                    },
                    "preference": {
                        "type": "string",
                        "enum": [
                            "closest",
                            "cheapest",
                            "fastest",
                        ],
                        "description": (
                            "How the charging stations should be ordered."
                        ),
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": (
                            "Maximum number of stations to return. "
                            "Defaults to 5."
                        ),
                    },
                },
                "required": [
                    "preference",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_emergency_charging_stations",
            "description": (
                "Find EV charging stations near a named place or current "
                "location for an urgent or emergency "
                "charging situation, such as when the user's battery is very low. "
                "Can also filter stations based on a vehicle model or connector type."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "latitude": {
                        "type": "number",
                        "description": "User latitude.",
                    },
                    "longitude": {
                        "type": "number",
                        "description": "User longitude.",
                    },
                    "location": {
                        "type": "string",
                        "description": (
                            "Named suburb, postcode, or address. Use this "
                            "when the user names a place."
                        ),
                    },
                    "vehicle_or_connector": {
                        "type": "string",
                        "description": (
                            "Optional vehicle model or connector mentioned by the "
                            "user, for example Nissan Leaf, Tesla Model 3, CCS2, "
                            "CHAdeMO, or Type 2."
                        ),
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_route_stations",
            "description": (
                "Find EV charging stations along a route between a "
                "start location and an end location. The locations can "
                "be addresses, suburbs, station names, or coordinates."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "start_location": {
                        "type": "string",
                        "description": (
                            "Starting location, address, suburb, "
                            "station name, or coordinates."
                        ),
                    },
                    "end_location": {
                        "type": "string",
                        "description": (
                            "Destination location, address, suburb, "
                            "station name, or coordinates."
                        ),
                    },
                },
                "required": [
                    "start_location",
                    "end_location",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_station_details",
            "description": (
                "Get detailed information about a specific EV charging "
                "station, including its address, charging power, number "
                "of charging points, cost, and estimated charging time."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "station_name": {
                        "type": "string",
                        "description": (
                            "Name of the EV charging station to look up."
                        ),
                    },
                },
                "required": ["station_name"],
            },
        },
    },
]


def _validate_coordinates(
    latitude: Any,
    longitude: Any,
) -> tuple[float, float]:
    """Validate and normalize latitude and longitude."""

    if (
        isinstance(latitude, bool)
        or isinstance(longitude, bool)
        or not isinstance(latitude, (int, float))
        or not isinstance(longitude, (int, float))
    ):
        raise ValueError(
            "Latitude and longitude must be numeric."
        )

    latitude = float(latitude)
    longitude = float(longitude)

    if not -90 <= latitude <= 90:
        raise ValueError(
            "Latitude must be between -90 and 90."
        )

    if not -180 <= longitude <= 180:
        raise ValueError(
            "Longitude must be between -180 and 180."
        )

    return latitude, longitude


def _resolve_tool_location(
    arguments: Dict[str, Any],
    latitude_key: str = "latitude",
    longitude_key: str = "longitude",
) -> tuple[tuple[float, float], str | None]:
    """Resolve an explicit named place first, then fall back to coordinates."""
    location = arguments.get("location")
    if isinstance(location, str) and location.strip():
        location = location.strip()
        coordinates = api_manager.geocode_location(location)

        if not coordinates:
            charger_data, _ = load_datasets()
            coordinates = get_location_coordinates(
                location,
                charger_data,
                DATA_CONFIG["CSV_COLUMNS"],
            )

        if not coordinates:
            raise ValueError(f"Could not resolve location: {location}")

        return _validate_coordinates(*coordinates), location

    coordinates = _validate_coordinates(
        arguments.get(latitude_key),
        arguments.get(longitude_key),
    )
    return coordinates, None


def _traffic_label(delay_minutes: Any) -> str:
    """Return a short traffic label from TomTom's route delay."""

    try:
        delay = float(delay_minutes or 0)
    except (TypeError, ValueError):
        return "Unknown"

    if delay < 1:
        return "Clear"
    if delay < 5:
        return "Light traffic"
    if delay < 15:
        return "Moderate traffic"

    return "Heavy traffic"


def _station_for_card(
    station: Dict[str, Any],
    start_coords: tuple[float, float],
) -> Dict[str, Any]:
    """Map a station to the frontend schema and add route information."""

    mapped = dict(station)
    mapped["origin_latitude"] = start_coords[0]
    mapped["origin_longitude"] = start_coords[1]

    latitude = station.get(
        "latitude",
        station.get("lat"),
    )

    longitude = station.get(
        "longitude",
        station.get("lon"),
    )

    try:
        station_coords = _validate_coordinates(
            latitude,
            longitude,
        )
    except ValueError:
        station_coords = None

    if station_coords:
        mapped["latitude"] = station_coords[0]
        mapped["longitude"] = station_coords[1]

        mapped["station_id"] = (
            f"{station_coords[0]},{station_coords[1]}"
        )

        route = api_manager.get_real_time_route(
            start_coords,
            station_coords,
        )

        if route:
            distance = route.get("distance_km")
            duration = route.get("duration_minutes")
            delay = route.get("traffic_delay_minutes")

            mapped["distance_km"] = (
                round(float(distance), 1)
                if distance is not None
                else mapped.get("distance_km")
            )

            mapped["travel_time_minutes"] = (
                round(float(duration), 1)
                if duration is not None
                else None
            )

            mapped["traffic_delay_minutes"] = (
                round(float(delay), 1)
                if delay is not None
                else None
            )

            mapped["traffic"] = _traffic_label(delay)

    mapped.setdefault(
        "station_id",
        str(mapped.get("name", "station")),
    )

    return mapped


def _stations_for_cards(
    stations: Any,
    start_coords: tuple[float, float],
    limit: int = 5,
) -> list[Dict[str, Any]]:
    """Prepare only the displayed stations to avoid excessive route calls."""

    return [
        _station_for_card(
            station,
            start_coords,
        )
        for station in stations[:limit]
        if isinstance(station, dict)
    ]


def execute_tool_call(
    name: str,
    arguments: Dict[str, Any],
) -> Any:
    """Execute an approved EVAT backend tool."""

    if not isinstance(arguments, dict):
        raise ValueError(
            "Tool arguments must be a dictionary."
        )

    # ---------------------------------------------------------
    # Station availability
    # ---------------------------------------------------------

    if name == "get_station_availability":
        (lat, lon), resolved_location = _resolve_tool_location(
            arguments,
            "lat",
            "lon",
        )

        status, updated_at, data = get_station_availability(
            lat,
            lon,
        )

        raw_error = None

        if isinstance(data, str):
            raw_error = data

        elif isinstance(data, dict):
            raw_value = data.get("raw")

            if isinstance(raw_value, str):
                raw_error = raw_value

        if raw_error and (
            "error" in raw_error.lower()
            or "exception" in raw_error.lower()
            or "unauthorized" in raw_error.lower()
        ):
            return {
                "type": "availability",
                "status": "Unknown",
                "updated_at": None,
                "data": {
                    "message": (
                        "Live charging availability is "
                        "currently unavailable."
                    )
                },
            }

        result = {
            "type": "availability",
            "status": status,
            "updated_at": updated_at,
            "data": data,
            "location": resolved_location,
        }

        # The frontend already renders station cards for any structured
        # result containing a stations array. Include the exact station that
        # TomTom checked so users can open directions to it.
        if isinstance(data, dict):
            station = data.get("station")
            if isinstance(station, dict):
                latitude = station.get("latitude")
                longitude = station.get("longitude")
                if isinstance(latitude, (int, float)) and isinstance(
                    longitude,
                    (int, float),
                ):
                    card_station = _station_for_card(
                        {
                            "name": station.get("name"),
                            "address": station.get("address"),
                            "latitude": latitude,
                            "longitude": longitude,
                            "distance_km": station.get("distance_km"),
                            "availability": status,
                        },
                        (lat, lon),
                    )
                    result["show_availability"] = True
                    result["stations"] = [card_station]

        return result

    if name == "get_nearby_stations":
        (latitude, longitude), resolved_location = _resolve_tool_location(
            arguments
        )

        limit = arguments.get("limit", 5)

        if (
            isinstance(limit, bool)
            or not isinstance(limit, int)
            or not 1 <= limit <= 10
        ):
            raise ValueError(
                "Limit must be an integer between 1 and 10."
            )

        stations = get_nearby_stations(
            latitude=latitude,
            longitude=longitude,
            radius_km=SEARCH_CONFIG["DEFAULT_RADIUS_KM"],
            limit=SEARCH_CONFIG["MAX_RESULTS"],
        )

        card_stations = _stations_for_cards(
            stations,
            (latitude, longitude),
            limit=limit,
        )

        return {
            "type": "stations",
            "show_availability": True,
            "count": len(card_stations),
            "stations": card_stations,
            "location": resolved_location,
        }

    if name == "get_stations_by_preference":
        (latitude, longitude), resolved_location = _resolve_tool_location(
            arguments
        )

        preference = arguments.get("preference")

        if not isinstance(preference, str):
            raise ValueError(
                "Charging preference must be a string."
            )

        preference = preference.lower().strip()

        allowed_preferences = {
            "closest",
            "cheapest",
            "fastest",
        }

        if preference not in allowed_preferences:
            raise ValueError(
                "Preference must be closest, cheapest, or fastest."
            )

        limit = arguments.get("limit", 5)

        if (
            isinstance(limit, bool)
            or not isinstance(limit, int)
            or not 1 <= limit <= 10
        ):
            raise ValueError(
                "Limit must be an integer between 1 and 10."
            )

        stations = get_stations_by_preference(
            latitude=latitude,
            longitude=longitude,
            preference=preference,
            limit=limit,
            preference_radius_km=SEARCH_CONFIG[
                "PREFERENCE_RADIUS_KM"
            ],
            prefilter_radius_km=SEARCH_CONFIG[
                "PREFERENCE_PREFILTER_KM"
            ],
            max_results=SEARCH_CONFIG["MAX_RESULTS"],
        )

        card_stations = _stations_for_cards(
            stations,
            (latitude, longitude),
            limit=limit,
        )

        return {
            "type": "stations",
            "show_availability": True,
            "preference": preference,
            "count": len(card_stations),
            "stations": card_stations,
            "location": resolved_location,
        }

    if name == "get_emergency_charging_stations":
        (latitude, longitude), resolved_location = _resolve_tool_location(
            arguments
        )

        vehicle_or_connector = arguments.get(
            "vehicle_or_connector",
            "",
        )

        if not isinstance(vehicle_or_connector, str):
            raise ValueError(
                "Vehicle or connector must be a string."
            )

        connector = infer_connector_from_message(
            vehicle_or_connector
        )

        stations = get_emergency_stations(
            latitude=latitude,
            longitude=longitude,
            radius_km=SEARCH_CONFIG["EMERGENCY_RADIUS_KM"],
            limit=SEARCH_CONFIG["EMERGENCY_MAX_RESULTS"],
            max_results=SEARCH_CONFIG["MAX_RESULTS"],
        )

        if connector:
            stations = filter_stations_by_connector(
                stations,
                connector,
                limit=SEARCH_CONFIG["EMERGENCY_MAX_RESULTS"],
            )

        card_stations = _stations_for_cards(
            stations,
            (latitude, longitude),
            limit=SEARCH_CONFIG["EMERGENCY_MAX_RESULTS"],
        )

        return {
            "type": "stations",
            "show_availability": True,
            "emergency": True,
            "connector": connector,
            "count": len(card_stations),
            "stations": card_stations,
            "location": resolved_location,
        }

    if name == "get_route_stations":
        start_location = arguments.get(
            "start_location"
        )

        end_location = arguments.get(
            "end_location"
        )

        valid_start_location = (
            isinstance(start_location, str)
            and bool(start_location.strip())
        ) or (
            isinstance(start_location, (list, tuple))
            and len(start_location) == 2
        )

        if not valid_start_location:
            raise ValueError(
                "Start location is required."
            )

        if (
            not isinstance(end_location, str)
            or not end_location.strip()
        ):
            raise ValueError(
                "End location is required."
            )

        charger_data, _ = load_datasets()

        start_coords = get_location_coordinates(
            start_location, charger_data, DATA_CONFIG["CSV_COLUMNS"]
        ) or (
            api_manager.geocode_location(start_location)
            if isinstance(start_location, str)
            else None
        )

        end_coords = get_location_coordinates(
            end_location, charger_data, DATA_CONFIG["CSV_COLUMNS"]
        ) or api_manager.geocode_location(
            end_location
        )

        if not start_coords:
            raise ValueError(
                f"Could not resolve start location: "
                f"{start_location}"
            )

        if not end_coords:
            raise ValueError(
                f"Could not resolve end location: "
                f"{end_location}"
            )

        stations, all_candidates = (
            backend_get_route_stations(
                start_coords=start_coords,
                end_coords=end_coords,
                route_radius_km=SEARCH_CONFIG[
                    "ROUTE_RADIUS_KM"
                ],
                max_results=SEARCH_CONFIG[
                    "MAX_RESULTS"
                ],
                earth_radius_km=LOCATION_CONFIG[
                    "EARTH_RADIUS_KM"
                ],
            )
        )

        card_stations = _stations_for_cards(
            stations,
            start_coords,
            limit=5,
        )

        return {
            "type": "stations",
            "show_availability": True,
            "start_location": start_location,
            "end_location": end_location,
            "start_coordinates": start_coords,
            "end_coordinates": end_coords,
            "count": len(card_stations),
            "stations": card_stations,
            "candidate_count": len(all_candidates),
        }

    # ---------------------------------------------------------
    # Station details
    # ---------------------------------------------------------

    if name == "get_station_details":
        station_name = arguments.get(
            "station_name"
        )

        if (
            not isinstance(station_name, str)
            or not station_name.strip()
        ):
            raise ValueError(
                "Station name is required."
            )

        station_name = station_name.strip()

        charger_data, _ = load_datasets()

        details = get_station_details(
            station_name=station_name,
            latest_stations=[],
            charger_data=charger_data,
            csv_columns=DATA_CONFIG[
                "CSV_COLUMNS"
            ],
            charging_time_estimates=CHARGING_CONFIG[
                "CHARGING_TIME_ESTIMATES"
            ],
        )

        if not details:
            return {
                "type": "station_details",
                "found": False,
                "station_name": station_name,
                "message": (
                    "No charging station details were found "
                    "for that station name."
                ),
            }

        return {
            "type": "station_details",
            "found": True,
            "station_name": station_name,
            "station": details,
        }

    raise ValueError(
        f"Unsupported EVAT tool: {name}"
    )

