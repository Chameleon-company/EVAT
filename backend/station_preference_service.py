import re
import logging
from typing import Any, Dict, List

from backend.charging_station_service import get_charging_stations

logger = logging.getLogger(__name__)


def get_stations_by_preference(
    latitude: float,
    longitude: float,
    preference: str,
    limit: int = 5,
    preference_radius_km: float = 10.0,
    prefilter_radius_km: float = 10.0,
    max_results: int = 20,
) -> List[Dict[str, Any]]:
    """Return nearby charging stations ordered by a user's preference."""

    stations, source = get_charging_stations(
        latitude=float(latitude),
        longitude=float(longitude),
        distance_km=prefilter_radius_km,
        limit=max_results,
    )

    logger.info(
        "Retrieved %s charging stations from %s for preference filtering",
        len(stations),
        source,
    )

    candidates: List[Dict[str, Any]] = []

    for station in stations:
        try:
            distance_km = float(station.get("distance_km", 9999))
        except (TypeError, ValueError):
            distance_km = 9999

        if distance_km <= preference_radius_km:
            station_copy = dict(station)
            station_copy["distance_km"] = round(distance_km, 2)
            candidates.append(station_copy)

    if not candidates:
        return []

    preference = (preference or "").lower().strip()

    if preference == "closest":
        candidates.sort(
            key=lambda station: station.get("distance_km", 9999)
        )

    elif preference == "cheapest":

        def extract_cost(station: Dict[str, Any]) -> float:
            cost_string = str(station.get("cost", "0"))

            if "free" in cost_string.lower():
                return 0.0

            numbers = re.findall(r"\d+\.?\d*", cost_string)

            if numbers:
                return float(numbers[0])

            return 999.0

        candidates.sort(key=extract_cost)

    elif preference == "fastest":

        def extract_power(station: Dict[str, Any]) -> float:
            power_string = str(station.get("power", "0"))
            numbers = re.findall(r"\d+\.?\d*", power_string)

            if numbers:
                return float(numbers[0])

            return 0.0

        candidates.sort(key=extract_power, reverse=True)

    else:
        candidates.sort(
            key=lambda station: station.get("distance_km", 9999)
        )

    return candidates[:limit]