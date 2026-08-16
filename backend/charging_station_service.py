import logging

from backend.csv_backup_service import get_csv_backup_stations, save_new_api_stations_to_csv

logger = logging.getLogger(__name__)


def get_charging_stations(
    latitude,
    longitude,
    distance_km=20,
    limit=20,
    save_to_csv=True
):
    try:
        # Import lazily so a missing API key or API dependency can still
        # fall through to the CSV backup below.
        from backend.openchargeapi import get_opencharge_stations

        stations = get_opencharge_stations(
            latitude=latitude,
            longitude=longitude,
            distance_km=distance_km,
            max_results=limit
        )

        if stations:
            stations.sort(
                key=lambda station: (
                    station.get("distance_km")
                    if station.get("distance_km") is not None
                    else 9999
                )
            )

            logger.info(
                "USING OPEN CHARGE MAP API - returned %s stations",
                len(stations)
            )

            if save_to_csv:
                save_new_api_stations_to_csv(stations)

            return stations, "Open Charge Map API"

    except Exception as error:
        logger.warning(
            "Open Charge Map API failed: %s. Using CSV backup.",
            error
        )

    backup_stations = get_csv_backup_stations(
        latitude=latitude,
        longitude=longitude,
        limit=limit,
        distance_km=distance_km
    )

    return backup_stations, "CSV Backup"
