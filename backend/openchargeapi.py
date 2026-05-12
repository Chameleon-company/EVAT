import requests

API_KEY = "396be4fd-31a8-4774-acfd-1f6a6d6dda38"


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

        connection_types = []
        power_values = []

        for conn in conns:
            conn_type = (conn.get("ConnectionType") or {}).get("Title")
            if conn_type:
                connection_types.append(conn_type)

            power = conn.get("PowerKW")
            if power is not None:
                power_values.append(power)

        stations.append({
            "name": addr.get("Title", "Unknown station"),
            "address": addr.get("AddressLine1", "Address unavailable"),
            "suburb": addr.get("Town"),
            "latitude": addr.get("Latitude"),
            "longitude": addr.get("Longitude"),
            "power": max(power_values) if power_values else "Unavailable",
            "connection_types": ", ".join(sorted(set(connection_types))) if connection_types else "Unavailable",
            "cost": item.get("UsageCost", "Unavailable"),
            "availability": (item.get("StatusType") or {}).get("Title", "Unknown"),
            "operator": (item.get("OperatorInfo") or {}).get("Title", "Unknown"),
            "points": item.get("NumberOfPoints", "Unavailable"),
            "source": "Open Charge Map"
        })

    return stations