from backend.openchargeapi import get_opencharge_stations
from backend.csv_backup_service import get_csv_backup_stations, save_new_api_stations_to_csv


def get_charging_stations(latitude, longitude, distance_km=20, limit=20, save_to_csv=True):
    try:
        stations = get_opencharge_stations(
            latitude=latitude,
            longitude=longitude,
            distance_km=distance_km,
            max_results=limit
        )

        if stations:
            print("USING OPEN CHARGE MAP API")

            if save_to_csv:
                save_new_api_stations_to_csv(stations)

            return stations, "Open Charge Map API"

    except Exception as error:
        print(f"Open Charge Map API failed: {error}")

    backup_stations = get_csv_backup_stations(
        latitude=latitude,
        longitude=longitude,
        limit=limit
    )

    return backup_stations, "CSV Backup"