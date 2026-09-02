from typing import Any, Dict, List

from backend.charging_station_service import get_charging_stations


def get_nearby_stations(
    latitude: float,
    longitude: float,
    radius_km: float = 8.0,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """Return nearby charging stations for a general "find chargers near me" request.

    Delegates to the shared get_charging_stations() data source (Open Charge
    Map first, CSV backup on failure) so this stays aligned with how the rest
    of the chatbot sources station data, rather than owning a separate copy
    of the lookup logic.
    """

    stations, _source = get_charging_stations(
        latitude=float(latitude),
        longitude=float(longitude),
        distance_km=radius_km,
        limit=limit,
    )

    return stations
