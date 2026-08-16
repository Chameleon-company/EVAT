import logging
import math
import os

import pandas as pd

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(
    BASE_DIR, "data", "raw", "ml_ev_charging_dataset.csv"
)


def calculate_distance_km(lat1, lon1, lat2, lon2):
    radius = 6371
    lat1 = math.radians(float(lat1))
    lon1 = math.radians(float(lon1))
    lat2 = math.radians(float(lat2))
    lon2 = math.radians(float(lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def _clean_value(value, default):
    """Return a JSON-safe CSV value or a supplied default."""
    if value is None or pd.isna(value):
        return default
    return value


def get_csv_backup_stations(latitude, longitude, limit=20, distance_km=None):
    if not os.path.exists(CSV_PATH):
        logger.error("CSV backup file not found at %s", CSV_PATH)
        return []

    try:
        df = pd.read_csv(CSV_PATH)
    except Exception as error:
        logger.error("Unable to read CSV backup: %s", error)
        return []

    stations = []

    for _, row in df.iterrows():
        try:
            station_lat = pd.to_numeric(row.get("Latitude"), errors="coerce")
            station_lon = pd.to_numeric(row.get("Longitude"), errors="coerce")
            if pd.isna(station_lat) or pd.isna(station_lon):
                continue

            distance = calculate_distance_km(
                latitude, longitude, station_lat, station_lon
            )
            if distance_km is not None and distance > float(distance_km):
                continue

            stations.append({
                "name": _clean_value(
                    row.get("Station_Name"), "Unknown station"),
                "address": _clean_value(
                    row.get("Address"), "Address unavailable"),
                "suburb": _clean_value(row.get("Suburb"), None),
                "latitude": float(station_lat),
                "longitude": float(station_lon),
                "power": _clean_value(
                    row.get("Power (kW)"), "Unavailable"),
                "connection_types": _clean_value(
                    row.get("Connection Types"), "Unavailable"),
                "cost": _clean_value(
                    row.get("Usage Cost"), "Unavailable"),
                "availability": _clean_value(
                    row.get("Availability"), "Saved dataset"),
                "operator": _clean_value(
                    row.get("Operator"),
                    _clean_value(row.get("Station_Name"), "Unknown")
                ),
                "points": _clean_value(
                    row.get("Number of Points"), "Unavailable"),
                "distance_km": round(distance, 2),
                "source": "Local CSV Backup"
            })
        except (TypeError, ValueError):
            continue

    stations.sort(key=lambda station: station["distance_km"])
    return stations[:limit]


def save_new_api_stations_to_csv(api_stations):
    try:
        if os.path.exists(CSV_PATH):
            df = pd.read_csv(CSV_PATH)
        else:
            os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
            df = pd.DataFrame()

        existing_names = set()
        existing_locations = set()

        if "Station_Name" in df.columns:
            existing_names = {
                str(value).strip().lower()
                for value in df["Station_Name"].dropna()
            }

        if "Latitude" in df.columns and "Longitude" in df.columns:
            latitudes = pd.to_numeric(df["Latitude"], errors="coerce")
            longitudes = pd.to_numeric(df["Longitude"], errors="coerce")
            existing_locations = {
                (round(float(lat), 5), round(float(lon), 5))
                for lat, lon in zip(latitudes, longitudes)
                if not pd.isna(lat) and not pd.isna(lon)
            }

        new_rows = []

        for station in api_stations:
            name = station.get("name")
            lat = station.get("latitude")
            lon = station.get("longitude")
            if not name or lat is None or lon is None:
                continue

            try:
                normalized_name = str(name).strip().lower()
                normalized_location = (
                    round(float(lat), 5), round(float(lon), 5)
                )
            except (TypeError, ValueError):
                continue

            if (normalized_name in existing_names
                    or normalized_location in existing_locations):
                continue

            new_rows.append({
                "Timestamp": pd.Timestamp.now().isoformat(),
                "Station_Name": name,
                "Longitude": lon,
                "Latitude": lat,
                "Address": station.get("address"),
                "Suburb": station.get("suburb"),
                "Distance_km": station.get("distance_km"),
                "ETA_min": None,
                "Suburb_Location_Lat": None,
                "Suburb_Location_Lon": None,
                "Power (kW)": station.get("power"),
                "Usage Cost": station.get("cost"),
                "Number of Points": station.get("points"),
                "Connection Types": station.get("connection_types"),
                "Availability": station.get("availability"),
                "Operator": station.get("operator"),
                "Source": station.get("source", "Open Charge Map API")
            })
            existing_names.add(normalized_name)
            existing_locations.add(normalized_location)

        if new_rows:
            df_new = pd.DataFrame(new_rows)
            df = pd.concat([df, df_new], ignore_index=True)
            df.to_csv(CSV_PATH, index=False)
            logger.info("Saved %s new API stations to CSV", len(new_rows))
        else:
            logger.info("No new API stations to save")
    except Exception as error:
        logger.warning("Unable to update CSV backup: %s", error)
