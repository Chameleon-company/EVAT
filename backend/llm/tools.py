from typing import Any, Dict

from backend.availability_service import get_station_availability


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
    }
]


def execute_tool_call(
    name: str,
    arguments: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute an approved EVAT backend tool."""

    if name != "get_station_availability":
        raise ValueError(f"Unsupported EVAT tool: {name}")

    if not isinstance(arguments, dict):
        raise ValueError("Tool arguments must be a dictionary.")

    lat = arguments.get("lat")
    lon = arguments.get("lon")

    if (
        isinstance(lat, bool)
        or isinstance(lon, bool)
        or not isinstance(lat, (int, float))
        or not isinstance(lon, (int, float))
    ):
        raise ValueError(
            "get_station_availability requires numeric lat and lon."
        )

    lat = float(lat)
    lon = float(lon)

    if not -90 <= lat <= 90:
        raise ValueError("Latitude must be between -90 and 90.")

    if not -180 <= lon <= 180:
        raise ValueError("Longitude must be between -180 and 180.")

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