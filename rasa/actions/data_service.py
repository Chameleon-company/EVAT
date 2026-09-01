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

from backend.charging_station_service import get_charging_stations

from backend.station_preference_service import (
    get_stations_by_preference as backend_get_stations_by_preference,
)

from backend.emergency_charging_service import (
    get_emergency_stations as backend_get_emergency_stations,
)

from backend.route_planning_service import (
    get_route_stations as backend_get_route_stations,
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
        """Get charging stations within specified radius of location"""
        if radius_km is None:
            radius_km = SEARCH_CONFIG['DEFAULT_RADIUS_KM']
        try:
            user_lat, user_lon = location
            stations, source = get_charging_stations(
                latitude=float(user_lat),
                longitude=float(user_lon),
                distance_km=radius_km,
                limit=SEARCH_CONFIG['MAX_RESULTS']
            )
            self.latest_stations = stations
            logger.info(
                f"Retrieved {len(stations)} charging stations from {source}")
            return stations
        except Exception as e:
            logger.error(f"Unable to retrieve nearby stations: {e}")
            return

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

    def get_station_details(self, station_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific station"""
        for station in self.latest_stations:
            if station_name.lower() in str(station.get('name', '')).lower():
                power_str = str(station.get('power', '22'))
                numbers = re.findall(r'\d+\.?\d*', power_str)
                power = float(numbers[0]) if numbers else 22.0
                charging_time = "Unknown"
                for _, (min_power, max_power, time_estimate) in CHARGING_CONFIG['CHARGING_TIME_ESTIMATES'].items():
                    if min_power <= power <= max_power:
                        charging_time = time_estimate
                        break
                details = dict(station)
                details.update({
                    'power': f"{power}kW",
                    'points': f"{station.get('points', 'Unknown')} points",
                    'charging_time': charging_time,
                    'trip_time': "Calculating..."
                })
                return details

        if self.charger_data.empty:
            return None

        # Search by name (case insensitive)
        mask = self.charger_data[DATA_CONFIG['CSV_COLUMNS']['CHARGER_NAME']].str.lower().str.contains(
            station_name.lower(), na=False
        )
        station = self.charger_data[mask]

        if station.empty:
            return None

        station = station.iloc[0]

        # Calculate estimated charging time based on power from CSV
        power_str = str(station.get(
            DATA_CONFIG['CSV_COLUMNS']['POWER_KW'], '22'))
        try:
            numbers = re.findall(r'\d+\.?\d*', power_str)
            power = float(numbers[0]) if numbers else 22.0
        except:
            power = 22.0

        # Use configuration-based charging time estimates
        charging_time = "Unknown"
        for power_range, (min_power, max_power, time_estimate) in CHARGING_CONFIG['CHARGING_TIME_ESTIMATES'].items():
            if min_power <= power <= max_power:
                charging_time = time_estimate
                break

        return {
            'name': station.get(DATA_CONFIG['CSV_COLUMNS']['CHARGER_NAME'], 'Unknown'),
            'address': station.get(DATA_CONFIG['CSV_COLUMNS']['ADDRESS'], 'Address not available'),
            'power': f"{power}kW",
            'points': f"{station.get(DATA_CONFIG['CSV_COLUMNS']['NUMBER_OF_POINTS'], 'Unknown')} points",
            'cost': station.get(DATA_CONFIG['CSV_COLUMNS']['USAGE_COST'], 'Cost not available'),
            'charging_time': charging_time,
            'trip_time': "Calculating..."
        }

    def _get_location_coordinates(self, location_input) -> Optional[Tuple[float, float]]:
        """Get coordinates using ONLY charger_info_mel.csv (station name, address, or suburb)."""
        if not location_input:
            return None

        # If location_input is already coordinates (tuple or list), return it directly
        if (isinstance(location_input, (tuple, list)) and len(location_input) == 2):
            try:
                lat, lng = float(location_input[0]), float(location_input[1])
                if lat != 0 and lng != 0:
                    logger.info(f"Using provided coordinates: ({lat}, {lng})")
                    return (lat, lng)
            except (ValueError, TypeError):
                pass

        # Handle string input (suburb names)
        if isinstance(location_input, str):
            location_clean = location_input.lower().strip()
        else:
            return None

        # Direct lookups against charger_info_mel.csv
        try:
            if self.charger_data is None or self.charger_data.empty:
                return None

            name_col = DATA_CONFIG['CSV_COLUMNS']['CHARGER_NAME']
            addr_col = DATA_CONFIG['CSV_COLUMNS']['ADDRESS']
            suburb_col = DATA_CONFIG['CSV_COLUMNS']['SUBURB']
            lat_col = DATA_CONFIG['CSV_COLUMNS']['LATITUDE']
            lon_col = DATA_CONFIG['CSV_COLUMNS']['LONGITUDE']

            # 1) Exact/contains match by station name
            try:
                mask = self.charger_data[name_col].astype(
                    str).str.lower().str.contains(location_clean, na=False)
                rows = self.charger_data[mask]
                if not rows.empty:
                    row = rows.iloc[0]
                    lat = float(row.get(lat_col, 0))
                    lon = float(row.get(lon_col, 0))
                    if lat != 0 and lon != 0:
                        logger.info(
                            f"Found coordinates from station name: '{row.get(name_col)}' → ({lat}, {lon})")
                        return (lat, lon)
            except Exception:
                pass

            # 2) Contains match by address
            try:
                mask = self.charger_data[addr_col].astype(
                    str).str.lower().str.contains(location_clean, na=False)
                rows = self.charger_data[mask]
                if not rows.empty:
                    row = rows.iloc[0]
                    lat = float(row.get(lat_col, 0))
                    lon = float(row.get(lon_col, 0))
                    if lat != 0 and lon != 0:
                        logger.info(
                            f"Found coordinates from address: '{row.get(addr_col)}' → ({lat}, {lon})")
                        return (lat, lon)
            except Exception:
                pass

            # 3) Exact/contains match by suburb
            try:
                sub_lower = self.charger_data[suburb_col].astype(
                    str).str.lower()
                mask = (sub_lower == location_clean) | sub_lower.str.contains(
                    location_clean, na=False)
                rows = self.charger_data[mask]
                if not rows.empty:
                    row = rows.iloc[0]
                    lat = float(row.get(lat_col, 0))
                    lon = float(row.get(lon_col, 0))
                    if lat != 0 and lon != 0:
                        logger.info(
                            f"Found coordinates from suburb: '{row.get(suburb_col)}' → ({lat}, {lon})")
                        return (lat, lon)
            except Exception:
                pass

            # 4) Fuzzy match against combined candidates (name, address, suburb) within charger_data
            try:
                candidates = []
                try:
                    candidates.extend(self.charger_data[name_col].dropna().astype(
                        str).str.lower().tolist())
                except Exception:
                    pass
                try:
                    candidates.extend(self.charger_data[addr_col].dropna().astype(
                        str).str.lower().tolist())
                except Exception:
                    pass
                try:
                    candidates.extend(self.charger_data[suburb_col].dropna().astype(
                        str).str.lower().tolist())
                except Exception:
                    pass

                import difflib as _difflib
                best = _difflib.get_close_matches(
                    location_clean, list(set(candidates)), n=1, cutoff=0.6)
                if best:
                    best_str = best[0]
                    mask = (
                        self.charger_data[name_col].astype(
                            str).str.lower() == best_str
                    ) | (
                        self.charger_data[addr_col].astype(
                            str).str.lower() == best_str
                    ) | (
                        self.charger_data[suburb_col].astype(
                            str).str.lower() == best_str
                    )
                    rows = self.charger_data[mask]
                    if not rows.empty:
                        row = rows.iloc[0]
                        lat = float(row.get(lat_col, 0))
                        lon = float(row.get(lon_col, 0))
                        if lat != 0 and lon != 0:
                            logger.info(
                                f"Fuzzy-matched '{location_clean}' → '{best_str}' → ({lat}, {lon})")
                            return (lat, lon)
            except Exception:
                pass
        except Exception:
            pass

        logger.warning(
            f"Could not find coordinates for location: '{location_input}'")
        return None

    def _calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calculate distance between two points using Haversine formula"""
        lat1, lon1 = point1
        lat2, lon2 = point2

        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))

        # Use configuration for Earth's radius
        radius = LOCATION_CONFIG['EARTH_RADIUS_KM']
        return radius * c

    def _get_station_availability(self, lat: float, lon: float):
        """
        Thin wrapper to get EV charging station availability.
        Returns: (status_str, updated_at, data_dict_or_str)
        """
        try:
            result = api_manager.get_charging_availability(lat, lon)

            if not isinstance(result, dict):
                return "Unknown", None, "No structured availability payload returned."

            status = "Unknown"
            if result.get("available") is True:
                status = "Yes"
            elif result.get("available") is False:
                status = "No"

            updated_at = result.get("updated_at")

            data = result.get("data", {})
            if not isinstance(data, dict):
                data = {"raw": data}

            return status, updated_at, data

        except Exception as e:
            return "Unknown", None, f"Error fetching availability: {e}"


# Global instance
data_service = ChargingStationDataService()
