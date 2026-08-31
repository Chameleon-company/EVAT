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
        
    def get_route_stations(
        self,
        start_location: str,
        end_location: str
    ) -> List[Dict[str, Any]]:
        """Get charging stations along a route using one TomTom route request."""

        logger.info(
            f"Planning route from '{start_location}' to '{end_location}'"
        )

        # Get coordinates for both locations
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

        logger.info(
            f"Route coordinates: {start_location} ({start_coords}) "
            f"-> {end_location} ({end_coords})"
        )

        # Make one TomTom request for the main route and its polyline
        route_info = None

        if REAL_TIME_AVAILABLE and api_manager is not None:
            try:
                route_info = api_manager.get_real_time_route(
                    start_coords,
                    end_coords
                )

                if isinstance(route_info, dict):
                    instructions = route_info.get("instructions") or []

                    logger.info(
                        f"Real-time route data: "
                        f"distance_km={route_info.get('distance_km')} "
                        f"duration_min={route_info.get('duration_minutes')} "
                        f"delay_min={route_info.get('traffic_delay_minutes')} "
                        f"instructions_count={len(instructions)}"
                    )
                else:
                    logger.warning(
                        "TomTom route data unavailable; using fallback route"
                    )

            except Exception as error:
                logger.warning(
                    f"Real-time route data unavailable: {error}"
                )
                route_info = None

        # Use TomTom road distance when available
        if route_info and route_info.get("source") == "tomtom":
            route_distance = float(route_info.get("distance_km", 0))
            logger.info(
                f"Real-time route distance: {route_distance:.1f} km"
            )
        else:
            # Straight-line fallback if TomTom is unavailable
            route_distance = self._calculate_distance(
                start_coords,
                end_coords
            )
            logger.info(
                f"Calculated fallback route distance: "
                f"{route_distance:.1f} km"
            )

        # Search Open Charge Map along the TomTom polyline.
        # CSV backup remains handled by get_charging_stations().
        route_stations = self._get_stations_along_route(
            start_coords,
            end_coords,
            route_distance,
            route_info
        )

        if route_stations:
            logger.info(
                f"Found {len(route_stations)} stations along route"
            )
            return route_stations

        logger.warning("No stations found along route")
        return []

    def _get_stations_along_route(self, start_coords: Tuple[float, float],
                                  end_coords: Tuple[float, float],
                                  route_distance: float,
                                  route_info: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Get stations strategically placed along the route"""
        # Calculate optimal search radius based on route distance
        # Add a small floor to avoid too-small radius on short routes
        search_radius = max(5.0, min(route_distance * 0.3,
                            SEARCH_CONFIG['ROUTE_RADIUS_KM']))
        logger.info(
            f"Route distance={route_distance:.2f} km, search_radius={search_radius:.2f} km")

        # Require real-time polyline to define true route corridor
        polyline: Optional[List[Tuple[float, float]]] = None
        try:
            if route_info and isinstance(route_info.get('polyline'), list):
                raw_poly = route_info.get('polyline') or []
                if len(raw_poly) >= 2:
                    polyline = [(float(lat), float(lon)) for (lat, lon) in raw_poly if isinstance(
                        lat, (int, float)) and isinstance(lon, (int, float))]
        except Exception:
            polyline = None

        if not polyline:
            logger.warning(
                "No polyline available from real-time route; using straight-line fallback corridor"
            )
            polyline = [start_coords, end_coords]

        # Query stations around sampled points along the route
        candidates: List[Dict[str, Any]] = []
        seen = set()
        # Space searches across the whole driving route. Five fixed samples can
        # leave large gaps on longer routes, so scale conservatively with route
        # length while capping external API calls.
        sample_count = min(
            len(polyline),
            max(2, min(12, int(route_distance / max(search_radius, 1.0)) + 2))
        )
        sample_indexes = sorted({round(i * (len(polyline) - 1) / (sample_count - 1))
                                 for i in range(sample_count)}) if sample_count > 1 else [0]

        for index in sample_indexes:
            try:
                sample_lat, sample_lon = polyline[index]
                stations, _ = get_charging_stations(
                    latitude=sample_lat,
                    longitude=sample_lon,
                    distance_km=search_radius,
                    limit=SEARCH_CONFIG['MAX_RESULTS']
                )
                for station in stations:
                    key = (str(station.get('name', '')).strip().lower(),
                           round(float(station.get('latitude', 0)), 5),
                           round(float(station.get('longitude', 0)), 5))
                    if key not in seen:
                        seen.add(key)
                        candidates.append(station)
            except Exception as e:
                logger.warning(
                    f"Unable to retrieve stations at route sample: {e}")

        all_stations = []
        for station in candidates:
            try:
                station_coords = (float(station.get('latitude')),
                                  float(station.get('longitude')))
                min_perp = self._min_perpendicular_distance_to_polyline(
                    polyline, station_coords)
                if min_perp is not None and min_perp <= search_radius:
                    station_info = dict(station)
                    station_info['distance_from_start'] = self._calculate_distance(
                        start_coords, station_coords)
                    station_info['distance_from_end'] = self._calculate_distance(
                        station_coords, end_coords)
                    all_stations.append(station_info)
            except (ValueError, TypeError):
                continue

        self.latest_stations = all_stations

        logger.info(
            f"Candidate stations within route corridor: {len(all_stations)}")

        if not all_stations:
            return []

        # Sort stations by optimal placement along route
        # Prefer stations that are roughly 1/3 and 2/3 along the route
        for station in all_stations:
            station['route_position_score'] = self._calculate_route_position_score(
                station['distance_from_start'], route_distance
            )

        # Sort by route position score (closer to optimal 1/3 and 2/3 positions)
        all_stations.sort(key=lambda x: x['route_position_score'])

        # Return top stations with route information
        return all_stations[:SEARCH_CONFIG['MAX_RESULTS']]

    def _min_perpendicular_distance_to_polyline(self, polyline: List[Tuple[float, float]], point: Tuple[float, float]) -> Optional[float]:
        """Compute minimum perpendicular distance (km) from point to any segment in the polyline."""
        if not polyline or len(polyline) < 2:
            return None
        try:
            from math import radians, cos, sqrt
            R = LOCATION_CONFIG['EARTH_RADIUS_KM']
            px, py = point
            pxr, pyr = radians(px), radians(py)
            # Use global ref lat as average of polyline to reduce distortion
            ref_lat = sum(radians(lat) for lat, _ in polyline) / len(polyline)
            cos_ref = cos(ref_lat)
            # Choose an origin (first vertex)
            lat0r, lon0r = radians(polyline[0][0]), radians(polyline[0][1])
            # Project point relative to origin
            P_x = (pyr - lon0r) * cos_ref * R
            P_y = (pxr - lat0r) * R

            min_dist = None
            # Iterate segments
            prev_lat, prev_lon = polyline[0]
            for lat, lon in polyline[1:]:
                a_lat_r, a_lon_r = radians(prev_lat), radians(prev_lon)
                b_lat_r, b_lon_r = radians(lat), radians(lon)
                A_x = (a_lon_r - lon0r) * cos_ref * R
                A_y = (a_lat_r - lat0r) * R
                B_x = (b_lon_r - lon0r) * cos_ref * R
                B_y = (b_lat_r - lat0r) * R
                v_x = B_x - A_x
                v_y = B_y - A_y
                w_x = P_x - A_x
                w_y = P_y - A_y
                seg_len_sq = v_x * v_x + v_y * v_y
                if seg_len_sq <= 1e-9:
                    # Degenerate segment, use distance to A
                    d_x = P_x - A_x
                    d_y = P_y - A_y
                    d = sqrt(d_x * d_x + d_y * d_y)
                else:
                    t = (w_x * v_x + w_y * v_y) / seg_len_sq
                    if t < 0.0:
                        Q_x, Q_y = A_x, A_y
                    elif t > 1.0:
                        Q_x, Q_y = B_x, B_y
                    else:
                        Q_x = A_x + t * v_x
                        Q_y = A_y + t * v_y
                    d_x = P_x - Q_x
                    d_y = P_y - Q_y
                    d = sqrt(d_x * d_x + d_y * d_y)
                if min_dist is None or d < min_dist:
                    min_dist = d
                prev_lat, prev_lon = lat, lon
            return min_dist
        except Exception:
            return None

    def _calculate_route_position_score(self, distance_from_start: float, total_route_distance: float) -> float:
        """Calculate how well positioned a station is along the route"""
        if total_route_distance == 0:
            return 0

        # Calculate position as percentage along route (0 = start, 1 = end)
        position = distance_from_start / total_route_distance
        # Optimal positions are around 1/3 and 2/3 of the route
        optimal_positions = [0.33, 0.67]
        min_distance = min(abs(position - opt) for opt in optimal_positions)
        # Lower score is better (closer to optimal position)
        return min_distance

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
