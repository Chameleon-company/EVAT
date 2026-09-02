"""
Data Service for EVAT Chatbot
Loads and provides access to charging station data from CSV datasets
Uses ONLY data available in charger_info_mel.csv
"""

import pandas as pd
import os
from typing import Dict, List, Tuple, Optional, Any
from math import radians, sin, cos, sqrt, atan2
import logging
import re
import sys
from .config import CHARGING_CONFIG, SEARCH_CONFIG, LOCATION_CONFIG, DATA_CONFIG

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.station_preference_service import (
    get_stations_by_preference as backend_get_stations_by_preference,
)

from backend.emergency_charging_service import (
    get_emergency_stations as backend_get_emergency_stations,
)

from backend.route_planning_service import (
    get_route_stations as backend_get_route_stations,
)
from backend.station_details_service import (
    get_station_details as backend_get_station_details,
)
from backend.availability_service import (
    get_station_availability as backend_get_station_availability,
)
from backend.location_resolution_service import (
    get_location_coordinates as backend_get_location_coordinates,
)
from backend.nearby_stations_service import (
    get_nearby_stations as backend_get_nearby_stations,
)
# Import the canonical backend implementation. Importing the same file as
# top-level ``real_time_apis`` can create a second module/global instance.
try:
    from backend.real_time_apis import api_manager
    REAL_TIME_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("Real-time APIs imported successfully")
except ImportError as e:
    REAL_TIME_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"Real-time APIs not available: {e}")

logger = logging.getLogger(__name__)


class ChargingStationDataService:
    """Service for accessing charging station data from datasets"""

    def __init__(self):
        self.charger_data = None
        self.coordinates_data = None
        self.latest_stations: List[Dict[str, Any]] = []
        self._load_datasets()

    def _load_datasets(self):
        """Load all CSV datasets"""
        try:
            # Get the path to the data directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            data_dir = os.path.join(
                current_dir, '..', '..', 'data', 'raw')

            # Load charger information dataset - PRIMARY DATA SOURCE
            charger_path = os.path.join(
                data_dir, DATA_CONFIG['CHARGER_CSV_PATH'].split('/')[-1])
            if os.path.exists(charger_path):
                self.charger_data = pd.read_csv(charger_path)
                logger.info(
                    f"Loaded {len(self.charger_data)} charging stations from dataset")
            else:
                logger.error(f"Charger dataset not found at {charger_path}")
                self.charger_data = pd.DataFrame()

            # Load coordinates dataset (optional - for location lookup)
            coords_path = os.path.join(
                data_dir, DATA_CONFIG['COORDINATES_CSV_PATH'].split('/')[-1])
            if os.path.exists(coords_path):
                self.coordinates_data = pd.read_csv(coords_path)
                logger.info(
                    f"Loaded {len(self.coordinates_data)} suburb coordinates from dataset")
            else:
                logger.warning(
                    "Coordinates dataset not found - will use charger data for coordinates")
                self.coordinates_data = pd.DataFrame()

            # ML dataset loading removed (unused)

        except Exception as e:
            logger.error(f"Error loading datasets: {e}")
            self.charger_data = pd.DataFrame()
            self.coordinates_data = pd.DataFrame()

    # Removed get_stations_by_suburb (unused)

    def get_nearby_stations(self, location: Tuple[float, float], radius_km: float = None) -> List[Dict[str, Any]]:
        """Get nearby charging stations via reusable backend service."""
        if radius_km is None:
            radius_km = SEARCH_CONFIG['DEFAULT_RADIUS_KM']
        try:
            user_lat, user_lon = location

            stations = backend_get_nearby_stations(
                latitude=float(user_lat),
                longitude=float(user_lon),
                radius_km=radius_km,
                limit=SEARCH_CONFIG['MAX_RESULTS'],
            )

            self.latest_stations = stations
            logger.info(f"Retrieved {len(stations)} nearby charging stations")
            return stations
        except Exception as e:
            logger.error(f"Unable to retrieve nearby stations: {e}")
            return []

    def get_route_stations(
        self,
        start_location: str,
        end_location: str
    ) -> List[Dict[str, Any]]:
        """Get charging stations along a route via reusable backend service."""

        logger.info(
            f"Planning route from '{start_location}' to '{end_location}'"
        )

        start_coords = self._get_location_coordinates(start_location)
        end_coords = self._get_location_coordinates(end_location)

        if not start_coords:
            logger.error(
                f"Could not find coordinates for start location: {start_location}"
            )
            return []

        if not end_coords:
            logger.error(
                f"Could not find coordinates for end location: {end_location}"
            )
            return []

        try:
            stations, all_candidates = backend_get_route_stations(
                start_coords=start_coords,
                end_coords=end_coords,
                route_radius_km=SEARCH_CONFIG["ROUTE_RADIUS_KM"],
                max_results=SEARCH_CONFIG["MAX_RESULTS"],
                earth_radius_km=LOCATION_CONFIG["EARTH_RADIUS_KM"],
            )

            self.latest_stations = all_candidates
            return stations

        except Exception as e:
            logger.error(
                f"Unable to retrieve route charging stations: {e}"
            )
            return []
    def get_stations_by_preference(
        self,
        location: Tuple[float, float],
        preference: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get stations based on user preference via reusable backend service."""

        try:
            user_lat, user_lon = location

            stations = backend_get_stations_by_preference(
                latitude=float(user_lat),
                longitude=float(user_lon),
                preference=preference,
                limit=limit,
                preference_radius_km=SEARCH_CONFIG.get(
                    "PREFERENCE_RADIUS_KM",
                    10.0
                ),
                prefilter_radius_km=SEARCH_CONFIG.get(
                    "PREFERENCE_PREFILTER_KM",
                    10.0
                ),
                max_results=SEARCH_CONFIG["MAX_RESULTS"],
            )

            self.latest_stations = stations
            return stations

        except Exception as e:
            logger.error(
                f"Unable to retrieve stations by preference: {e}"
            )
            return []

    def get_emergency_stations(
        self,
        location: str
    ) -> List[Dict[str, Any]]:
        """Get emergency stations via reusable backend service."""

        coords = self._get_location_coordinates(location)

        if not coords:
            return []

        return self.get_emergency_stations_from_coordinates(coords)

    def get_emergency_stations_from_coordinates(
        self,
        coordinates: Tuple[float, float]
    ) -> List[Dict[str, Any]]:
        """Get emergency stations from coordinates via reusable backend service."""

        if not coordinates:
            return []

        try:
            latitude, longitude = coordinates

            stations = backend_get_emergency_stations(
                latitude=float(latitude),
                longitude=float(longitude),
                radius_km=SEARCH_CONFIG["EMERGENCY_RADIUS_KM"],
                limit=SEARCH_CONFIG["EMERGENCY_MAX_RESULTS"],
                max_results=SEARCH_CONFIG["MAX_RESULTS"],
            )

            self.latest_stations = stations
            return stations

        except Exception as e:
            logger.error(
                f"Unable to retrieve emergency charging stations: {e}"
            )
            return []

    def get_station_details(
        self,
        station_name: str
    ) -> Optional[Dict[str, Any]]:
        """Get station details via reusable backend service."""

        try:
            return backend_get_station_details(
                station_name=station_name,
                latest_stations=self.latest_stations,
                charger_data=self.charger_data,
                csv_columns=DATA_CONFIG["CSV_COLUMNS"],
                charging_time_estimates=CHARGING_CONFIG[
                    "CHARGING_TIME_ESTIMATES"
                ],
            )

        except Exception as e:
            logger.error(
                f"Unable to retrieve station details: {e}"
            )
            return None

    def _get_location_coordinates(
        self,
        location_input
    ) -> Optional[Tuple[float, float]]:
        """Resolve location coordinates via reusable backend service."""

        return backend_get_location_coordinates(
            location_input=location_input,
            charger_data=self.charger_data,
            csv_columns=DATA_CONFIG["CSV_COLUMNS"],
        )
    def _get_station_availability(
        self,
        lat: float,
        lon: float
    ):
        """Get station availability via reusable backend service."""

        return backend_get_station_availability(
            lat,
            lon,
        )

# Global instance
data_service = ChargingStationDataService()
