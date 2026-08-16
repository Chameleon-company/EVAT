import os
import requests
from math import radians, sin, cos, sqrt, atan2
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENCHARGEMAP_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "OPENCHARGEMAP_API_KEY environment variable is not set."
    )


def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Calculate straight-line distance between two coordinates."""
    earth_radius_km = 6371.0

    lat1_rad = radians(float(lat1))
    lon1_rad = radians(float(lon1))
    lat2_rad = radians(float(lat2))
    lon2_rad = radians(float(lon2))

    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earth_radius_km * c


def _value_or_default(value, default):
    """Replace null or blank API values with a chatbot-safe default."""
    if value is None or (isinstance(value, str) and not value.strip()):
        return default
    return value


def get_opencharge_stations(latitude, longitude, distance_km=20, max_results=20):
    url = "https://api.openchargemap.io/v3/poi/"

    headers = {
        "X-API-Key": API_KEY,
        "User-Agent": "EVAT-Chatbot"
    }

    params = {
        "output": "json",
        "latitude": latitude,
        "longitude": longitude,
        "distance": distance_km,
        "distanceunit": "KM",
        "maxresults": max_results,
        "compact": False,
        "verbose": False
    }

    response = requests.get(url, headers=headers, params=params, timeout=10)
    response.raise_for_status()

    stations = []

    for item in response.json():
        addr = item.get("AddressInfo", {}) or {}
        conns = item.get("Connections", []) or []

        try:
            station_latitude = float(addr.get("Latitude"))
            station_longitude = float(addr.get("Longitude"))
            if not (-90 <= station_latitude <= 90
                    and -180 <= station_longitude <= 180):
                continue
            distance_from_search_km = round(
                calculate_distance_km(
                    latitude,
                    longitude,
                    station_latitude,
                    station_longitude
                ),
                2
            )
        except (TypeError, ValueError):
            continue

        connection_types = []
        power_values = []

        for conn in conns:
            conn_type = (conn.get("ConnectionType") or {}).get("Title")
            if conn_type:
                connection_types.append(conn_type)

            power = conn.get("PowerKW")
            if power is not None:
                try:
                    power_values.append(float(power))
                except (TypeError, ValueError):
                    continue

        stations.append({
            "name": _value_or_default(
                addr.get("Title"), "Unknown station"),
            "address": _value_or_default(
                addr.get("AddressLine1"), "Address unavailable"),
            "suburb": _value_or_default(addr.get("Town"), None),
            "latitude": station_latitude,
            "longitude": station_longitude,
            "distance_km": distance_from_search_km,
            "power": max(power_values) if power_values else "Unavailable",
            "connection_types": ", ".join(sorted(set(connection_types))) if connection_types else "Unavailable",
            "cost": _value_or_default(
                item.get("UsageCost"), "Unavailable"),
            "availability": _value_or_default(
                (item.get("StatusType") or {}).get("Title"), "Unknown"),
            "operator": _value_or_default(
                (item.get("OperatorInfo") or {}).get("Title"), "Unknown"),
            "points": _value_or_default(
                item.get("NumberOfPoints"), "Unavailable"),
            "source": "Open Charge Map"
        })

    return stations
