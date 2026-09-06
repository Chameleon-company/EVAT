from typing import Any, Dict, Optional, Tuple

from backend.real_time_apis import api_manager


def get_station_availability(
    lat: float,
    lon: float,
) -> Tuple[str, Optional[Any], Any]:
    """Get EV charging station availability."""

    try:
        result = api_manager.get_charging_availability(
            lat,
            lon,
        )

        if not isinstance(result, dict):
            return (
                "Unknown",
                None,
                "No structured availability payload returned.",
            )

        status = "Unknown"

        if result.get("available") is True:
            status = "Yes"
        elif result.get("available") is False:
            status = "No"

        updated_at = result.get("updated_at")

        data = result.get("data", {})

        if not isinstance(data, dict):
            data = {"raw": data}

        return status, updated_at, data

    except Exception as e:
        return (
            "Unknown",
            None,
            f"Error fetching availability: {e}",
        )