from typing import Any, Dict, List, Optional

from backend.charging_station_service import get_charging_stations


def get_emergency_stations(
    latitude: float,
    longitude: float,
    radius_km: float = 15.0,
    limit: int = 5,
    max_results: int = 20,
) -> List[Dict[str, Any]]:
    """Return nearby charging stations for an emergency charging request."""

    stations, _ = get_charging_stations(
        latitude=float(latitude),
        longitude=float(longitude),
        distance_km=radius_km,
        limit=max_results,
    )

    return stations[:limit]


def infer_connector_from_message(message: str) -> Optional[str]:
    """Infer an EV connector type from a connector name or vehicle model."""

    msg = (message or "").lower()

    # Direct connector mentions
    if "chademo" in msg:
        return "chademo"

    if "ccs2" in msg or "ccs 2" in msg or "ccs" in msg:
        return "ccs"

    if "type 2" in msg or "mennekes" in msg:
        return "type 2"

    if "tesla" in msg:
        return "tesla"

    car_ccs = [
        # Hyundai/Kia
        "ioniq", "kona", "ev6", "e-niro", "niro", "soul ev",

        # MG
        "mg zs", "mg 4", "mg 5", "mg marvel", "mg cyberster",

        # Polestar/Volvo
        "polestar", "volvo xc40", "volvo c40", "volvo ex30", "volvo ex90",

        # BYD
        "byd", "atto 3", "dolphin", "seal", "tang", "han",

        # Volkswagen Group
        "id.3", "id.4", "id.5", "id.buzz",
        "audi e-tron", "audi q4", "porsche taycan",

        # BMW
        "bmw i3", "bmw i4", "bmw ix", "bmw i7", "bmw i5",

        # Mercedes
        "eqa", "eqb", "eqc", "eqe", "eqs", "mercedes ev",

        # Ford
        "mustang mach-e", "f-150 lightning", "e-transit",

        # Chevrolet
        "bolt", "bolt euv", "silverado ev", "blazer ev",

        # Other popular EVs
        "rivian r1t", "rivian r1s",
        "lucid air", "fisker ocean", "canoo",
    ]

    car_chademo = [
        "leaf",
        "ariya",
        "outlander phev",
        "i-miev",
        "soul ev 2014-2019",
    ]

    car_type2 = [
        "tesla model s",
        "tesla model x",
        "tesla model 3",
        "tesla model y",
        "renault zoe",
        "peugeot e-208",
        "opel corsa-e",
        "fiat 500e",
        "toyota bz4x",
        "subaru solterra",
        "lexus rz",
    ]

    car_tesla = [
        "tesla model s",
        "tesla model x",
        "tesla model 3",
        "tesla model y",
        "cybertruck",
        "roadster",
    ]

    for keyword in car_ccs:
        if keyword in msg:
            return "ccs"

    for keyword in car_chademo:
        if keyword in msg:
            return "chademo"

    for keyword in car_type2:
        if keyword in msg:
            return "type 2"

    for keyword in car_tesla:
        if keyword in msg:
            return "tesla"

    return None


def connector_matches(
    connector: str,
    connection_types: str,
    power: str = "",
) -> bool:
    """Check whether station data is compatible with a connector type."""

    connector = (connector or "").lower()
    conn_str = (connection_types or "").lower()
    power_str = (power or "").lower()

    if connector in conn_str or connector in power_str:
        return True

    if connector == "type 2":
        connector_codes = ["25", "1036"]

    elif connector == "ccs":
        connector_codes = ["33", "1", "21", "31"]

    elif connector == "chademo":
        connector_codes = ["2", "4", "24", "34"]

    elif connector == "tesla":
        connector_codes = ["33", "1036"]

    else:
        return False

    return any(code in conn_str for code in connector_codes)


def filter_stations_by_connector(
    stations: List[Dict[str, Any]],
    connector: Optional[str],
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Return emergency stations compatible with the requested connector."""

    if not connector:
        return stations[:limit]

    matched = [
        station
        for station in stations
        if connector_matches(
            connector,
            str(station.get("connection_types", "")),
            str(station.get("power", "")),
        )
    ]

    return matched[:limit]