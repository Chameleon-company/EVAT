import pandas as pd
import math

CSV_PATH = "data/raw/ml_ev_charging_dataset.csv"


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


def get_csv_backup_stations(latitude, longitude, limit=20):
    df = pd.read_csv(CSV_PATH)

    stations = []

    for _, row in df.iterrows():
        station_lat = row.get("Latitude")
        station_lon = row.get("Longitude")

        if pd.isna(station_lat) or pd.isna(station_lon):
            continue

        distance = calculate_distance_km(
            latitude,
            longitude,
            station_lat,
            station_lon
        )

        stations.append({
            "name": row.get("Station_Name", "Unknown station"),
            "address": row.get("Address", "Address unavailable"),
            "suburb": None,
            "latitude": station_lat,
            "longitude": station_lon,
            "power": "Unavailable",
            "connection_types": "Unavailable",
            "cost": "Unavailable",
            "availability": "Saved dataset",
            "operator": row.get("Station_Name", "Unknown"),
            "points": "Unavailable",
            "distance_km": round(distance, 2),
            "source": "Local CSV Backup"
        })

    stations = sorted(stations, key=lambda x: x["distance_km"])
    return stations[:limit]

def save_new_api_stations_to_csv(api_stations):
    df = pd.read_csv(CSV_PATH)

    new_rows = []

    for station in api_stations:
        lat = station.get("latitude")
        lon = station.get("longitude")

        if lat is None or lon is None:
            continue

        # Check duplicate using latitude + longitude
        exists = (
            (df["Latitude"].astype(float).round(6) == round(float(lat), 6)) &
            (df["Longitude"].astype(float).round(6) == round(float(lon), 6))
        ).any()

        if exists:
            continue

        new_rows.append({
            "Timestamp": pd.Timestamp.now().isoformat(),
            "Station_Name": station.get("name"),
            "Longitude": lon,
            "Latitude": lat,
            "Address": station.get("address"),
            "Distance_km": station.get("distance_km"),
            "ETA_min": None,
            "Suburb_Location_Lat": None,
            "Suburb_Location_Lon": None,
            "Power (kW)": station.get("power"),
            "Usage Cost": station.get("cost"),
            "Number of Points": station.get("points"),
            "Connection Types": station.get("connection_types"),
            "Source": station.get("source", "Open Charge Map")
        })

    if new_rows:
        df_new = pd.DataFrame(new_rows)
        df = pd.concat([df, df_new], ignore_index=True)
        df.to_csv(CSV_PATH, index=False)
        print(f"Saved {len(new_rows)} new API stations to CSV.")
    else:
        print("No new API stations to save.")

def save_new_api_stations_to_csv(api_stations):
    df = pd.read_csv(CSV_PATH)

    new_rows = []

    for station in api_stations:
        name = station.get("name")
        lat = station.get("latitude")
        lon = station.get("longitude")

        if not name or lat is None or lon is None:
            continue

        # Check if station already exists by name OR coordinates
        exists_by_name = df["Station_Name"].astype(str).str.lower().eq(str(name).lower()).any()

        exists_by_location = (
            (df["Latitude"].astype(float).round(5) == round(float(lat), 5)) &
            (df["Longitude"].astype(float).round(5) == round(float(lon), 5))
        ).any()

        if exists_by_name or exists_by_location:
            continue

        new_rows.append({
            "Timestamp": pd.Timestamp.now().isoformat(),
            "Station_Name": name,
            "Longitude": lon,
            "Latitude": lat,
            "Address": station.get("address"),
            "Distance_km": station.get("distance_km"),
            "ETA_min": None,
            "Suburb_Location_Lat": None,
            "Suburb_Location_Lon": None,
            "Power (kW)": station.get("power"),
            "Usage Cost": station.get("cost"),
            "Number of Points": station.get("points"),
            "Connection Types": station.get("connection_types"),
            "Source": station.get("source", "Open Charge Map API")
        })

    if new_rows:
        df_new = pd.DataFrame(new_rows)
        df = pd.concat([df, df_new], ignore_index=True)
        df.to_csv(CSV_PATH, index=False)
        print(f"✅ Saved {len(new_rows)} new API stations to CSV.")
    else:
        print("ℹ️ No new API stations to save.")