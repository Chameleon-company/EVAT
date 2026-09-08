from typing import Any, Dict

from backend.availability_service import get_station_availability
from backend.config import SEARCH_CONFIG
from backend.station_preference_service import get_stations_by_preference


EVAT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_station_availability",
            "description": (
                "Check EV charging station availability using latitude "
                "and longitude."
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
                },
                "required": ["lat", "lon"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stations_by_preference",
            "description": (
                "Find nearby EV charging stations and order them by the "
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
                    "latitude",
                    "longitude",
                    "preference",
                ],
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


def execute_tool_call(
    name: str,
    arguments: Dict[str, Any],
) -> Any:
    """Execute an approved EVAT backend tool."""

    if not isinstance(arguments, dict):
        raise ValueError(
            "Tool arguments must be a dictionary."
        )

    if name == "get_station_availability":
        lat, lon = _validate_coordinates(
            arguments.get("lat"),
            arguments.get("lon"),
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
                "status": "Unknown",
                "updated_at": None,
                "data": {
                    "message": (
                        "Live charging availability is currently unavailable."
                    )
                },
            }

        return {
            "status": status,
            "updated_at": updated_at,
            "data": data,
        }

    if name == "get_stations_by_preference":
        latitude, longitude = _validate_coordinates(
            arguments.get("latitude"),
            arguments.get("longitude"),
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

        return {
            "preference": preference,
            "count": len(stations),
            "stations": stations,
        }

    raise ValueError(
        f"Unsupported EVAT tool: {name}"
    )