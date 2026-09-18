import re
from typing import Any, Dict, List, Optional


def get_station_details(
    station_name: str,
    latest_stations: List[Dict[str, Any]],
    charger_data: Any,
    csv_columns: Dict[str, str],
    charging_time_estimates: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Get detailed information about a charging station."""

    # First check stations already returned during the current interaction.
    for station in latest_stations:
        if station_name.lower() in str(station.get("name", "")).lower():
            power_str = str(station.get("power", "22"))
            numbers = re.findall(r"\d+\.?\d*", power_str)
            power = float(numbers[0]) if numbers else 22.0

            charging_time = _get_charging_time(
                power,
                charging_time_estimates,
            )

            details = dict(station)

            details.update({
                "power": f"{power}kW",
                "points": f"{station.get('points', 'Unknown')} points",
                "charging_time": charging_time,
                "trip_time": "Calculating...",
            })

            return details

    # Fall back to the charger CSV dataset.
    if charger_data is None or charger_data.empty:
        return None

    name_column = csv_columns["CHARGER_NAME"]

    mask = (
        charger_data[name_column]
        .str.lower()
        .str.contains(
            station_name.lower(),
            na=False,
        )
    )

    station_matches = charger_data[mask]

    if station_matches.empty:
        return None

    station = station_matches.iloc[0]

    power_str = str(
        station.get(
            csv_columns["POWER_KW"],
            "22",
        )
    )

    try:
        numbers = re.findall(
            r"\d+\.?\d*",
            power_str,
        )

        power = (
            float(numbers[0])
            if numbers
            else 22.0
        )

    except Exception:
        power = 22.0

    charging_time = _get_charging_time(
        power,
        charging_time_estimates,
    )

    return {
        "name": station.get(
            csv_columns["CHARGER_NAME"],
            "Unknown",
        ),
        "address": station.get(
            csv_columns["ADDRESS"],
            "Address not available",
        ),
        "power": f"{power}kW",
        "points": (
            f"{station.get(csv_columns['NUMBER_OF_POINTS'], 'Unknown')} points"
        ),
        "cost": station.get(
            csv_columns["USAGE_COST"],
            "Cost not available",
        ),
        "charging_time": charging_time,
        "trip_time": "Calculating...",
    }


def _get_charging_time(
    power: float,
    charging_time_estimates: Dict[str, Any],
) -> str:
    """Return the configured charging-time estimate for a power level."""

    charging_time = "Unknown"

    for _, (
        min_power,
        max_power,
        time_estimate,
    ) in charging_time_estimates.items():

        if min_power <= power <= max_power:
            charging_time = time_estimate
            break

    return charging_time