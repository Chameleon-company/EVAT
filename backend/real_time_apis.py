import os
import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import requests
import datetime

_station_cache: Dict[str, Dict[str, Any]] = {}
logger = logging.getLogger(__name__)
try:
    from dotenv import load_dotenv

    current_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(current_dir, '..'))
    env_dir = os.path.join(repo_root, 'env')

    if os.path.exists(os.path.join(env_dir, '.env')):
        load_dotenv(os.path.join(env_dir, '.env'))
    elif os.path.exists(os.path.join(repo_root, '.env')):
        load_dotenv(os.path.join(repo_root, '.env'))
except Exception:
    pass


class ApiManager:

    def __init__(self, api_key: Optional[str] = None, timeout_seconds: int = 15) -> None:
        self.api_key = api_key or os.environ.get('TOMTOM_API_KEY') or ''
        self.timeout_seconds = timeout_seconds
        self.base_url = 'https://api.tomtom.com'

    def _has_key(self) -> bool:
        return isinstance(self.api_key, str) and len(self.api_key.strip()) > 0

    def get_real_time_route(self, start_coords: Tuple[float, float], end_coords: Tuple[float, float]) -> Optional[Dict[str, Any]]:
        """Return route with traffic-aware summary.
        Coords are (lat, lon).
        """
        if not self._has_key():
            return None
        try:
            start_lat, start_lon = start_coords
            end_lat, end_lon = end_coords
            path = f"/routing/1/calculateRoute/{start_lat},{start_lon}:{end_lat},{end_lon}/json"
            url = f"{self.base_url}{path}"
            params = {
                'routeType': 'fastest',
                'traffic': 'true',
                'travelMode': 'car',
                'instructionsType': 'text',
                # TomTom returns route geometry as points for this representation.
                'routeRepresentation': 'polyline',
                'key': self.api_key,
            }
            resp = requests.get(url, params=params,
                                timeout=self.timeout_seconds)
            resp.raise_for_status()
            data = resp.json()
            routes = data.get('routes', [])
            if not routes:
                return None
            route = routes[0]
            summary = route.get('summary', {})
            distance_km = float(summary.get('lengthInMeters', 0)) / 1000.0
            duration_min = float(summary.get('travelTimeInSeconds', 0)) / 60.0
            delay_min = float(summary.get('trafficDelayInSeconds', 0)) / 60.0

            instructions: List[str] = []
            try:
                for inst in route.get('guidance', {}).get('instructions', []) or []:
                    msg = inst.get('message')
                    if msg:
                        instructions.append(str(msg))
            except Exception:
                instructions = []

            # TomTom may return points on the route or on individual legs,
            # depending on the API response/version. Support both shapes.
            polyline: List[Tuple[float, float]] = []
            point_groups = [route.get('points') or []]
            point_groups.extend(
                leg.get('points') or []
                for leg in (route.get('legs') or [])
                if isinstance(leg, dict)
            )
            for points in point_groups:
                for point in points:
                    if not isinstance(point, dict):
                        continue
                    lat = point.get('latitude', point.get('lat'))
                    lon = point.get('longitude', point.get('lon'))
                    try:
                        lat_value = float(lat)
                        lon_value = float(lon)
                    except (TypeError, ValueError):
                        continue
                    if -90 <= lat_value <= 90 and -180 <= lon_value <= 180:
                        coordinate = (lat_value, lon_value)
                        if not polyline or coordinate != polyline[-1]:
                            polyline.append(coordinate)

            logger.info("TomTom route returned %s geometry points", len(polyline))

            return {
                'source': 'tomtom',
                'distance_km': distance_km,
                'duration_minutes': duration_min,
                'traffic_delay_minutes': delay_min,
                'instructions': instructions,
                'polyline': polyline if polyline else None,
            }
        except requests.RequestException as error:
            response = getattr(error, "response", None)
            status_code = getattr(response, "status_code", "unknown")

            logger.warning(
                "TomTom route request failed with HTTP status %s",
                status_code
            )
            return None
        except (TypeError, ValueError, KeyError) as error:
            logger.warning("Unable to parse TomTom route response: %s", error)
            return None

    def get_real_time_traffic(self, start_coords: Tuple[float, float], end_coords: Tuple[float, float]) -> Optional[Dict[str, Any]]:
        """Return traffic details for a route. Uses route summary as a proxy.

        Coords are (lat, lon).
        """
        # First, use route summary to derive delay
        route = self.get_real_time_route(start_coords, end_coords)
        if not route:
            return None

        estimated_delay_minutes = route.get('traffic_delay_minutes', 0)

        # Then, try to enrich with TomTom Traffic Flow (absolute) speeds near route midpoint
        current_speed_kmh: Optional[float] = None
        free_flow_speed_kmh: Optional[float] = None
        congestion_level: Optional[int] = None
        try:
            mid_lat = (float(start_coords[0]) + float(end_coords[0])) / 2.0
            mid_lon = (float(start_coords[1]) + float(end_coords[1])) / 2.0
            flow_url = f"{self.base_url}/traffic/services/4/flowSegmentData/absolute/10/json"
            params = {
                'point': f"{mid_lat},{mid_lon}",
                'unit': 'KMPH',
                'key': self.api_key,
            }
            resp = requests.get(flow_url, params=params,
                                timeout=self.timeout_seconds)
            resp.raise_for_status()
            flow = resp.json()
            fsd = (flow or {}).get('flowSegmentData') or {}
            cs = fsd.get('currentSpeed')
            ffs = fsd.get('freeFlowSpeed')
            if isinstance(cs, (int, float)) and isinstance(ffs, (int, float)):
                current_speed_kmh = float(cs)
                free_flow_speed_kmh = float(ffs)
                # Derive a simple congestion level from speed ratio
                ratio = current_speed_kmh / \
                    free_flow_speed_kmh if free_flow_speed_kmh and free_flow_speed_kmh > 0 else 1.0
                if ratio >= 0.9:
                    congestion_level = 0  # free-flow
                elif ratio >= 0.7:
                    congestion_level = 1  # light
                elif ratio >= 0.5:
                    congestion_level = 2  # moderate
                else:
                    congestion_level = 3  # heavy
        except Exception:
            # If flow API fails, keep speeds as None and continue
            pass

        return {
            'source': 'tomtom',
            'traffic_status': 'Available',
            'congestion_level': congestion_level,
            'current_speed_kmh': current_speed_kmh,
            'free_flow_speed_kmh': free_flow_speed_kmh,
            'estimated_delay_minutes': estimated_delay_minutes,
        }

    def get_charging_station_real_time_data(self, x: Union[float, str], y: Union[float, Tuple[float, float]], radius_km: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """Two modes:
        - Nearby mode: (lat: float, lon: float, radius_km: float) → returns stations list
        - Per-station mode: (station_name: str, (lat, lon)) → not supported by TomTom without ID; returns None
        """
        if not self._has_key():
            return None

        # Nearby stations mode
        if isinstance(x, (int, float)) and isinstance(y, (int, float)):
            lat = float(x)
            lon = float(y)
            radius = float(radius_km or 15.0)
            try:
                url = f"{self.base_url}/search/2/nearbySearch/.json"
                params = {
                    'lat': lat,
                    'lon': lon,
                    'limit': 10,
                    'radius': int(radius * 1000),
                    'categorySet': 7309,  # EV Charging Stations
                    'key': self.api_key,
                }
                resp = requests.get(url, params=params,
                                    timeout=self.timeout_seconds)
                resp.raise_for_status()
                data = resp.json()
                results = data.get('results', [])
                stations: List[Dict[str, Any]] = []
                for r in results:
                    poi = r.get('poi', {})
                    addr = r.get('address', {})
                    pos = r.get('position', {})
                    stations.append({
                        'name': poi.get('name', 'Unknown Station'),
                        'address': addr.get('freeformAddress', 'Unknown'),
                        'power_kw': None,  # Not available in nearby API; can be enriched later
                        'cost_per_kwh': None,
                        'available_points': None,
                        'total_connectors': None,
                        'charging_speed': None,
                        'distance_km': r.get('dist', 0) / 1000.0 if isinstance(r.get('dist'), (int, float)) else None,
                        'lat': pos.get('lat'),
                        'lon': pos.get('lon'),
                    })
                return {
                    'source': 'tomtom',
                    'stations': stations,
                }
            except Exception:
                return None

        return None

    """
    Removed unused geocode.
    """

    def get_charging_availability(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Get basic availability of a charging station near given coordinates.

        Returns:
            {
                "available": True/False/None,
                "updated_at": ISO timestamp or None,
                "data": full JSON from TomTom or error info
            }
        """
        station_key = f"{lat:.4f},{lon:.4f}"
        api_key = self.api_key

        # --- Cache check ---
        if station_key in _station_cache:
            if _station_cache[station_key]["expiry"] > datetime.datetime.utcnow():
                return _station_cache[station_key]["data"]

        try:
            # Step 1: Find nearest EV charging station (categorySet=7309)
            nearby_url = (
                f"https://api.tomtom.com/search/2/nearbySearch/.json?"
                f"lat={lat}&lon={lon}&key={api_key}&radius=500&limit=1&categorySet=7309"
            )
            resp1 = requests.get(nearby_url, timeout=5)
            resp1.raise_for_status()
            nearby_data = resp1.json()

            if not nearby_data.get("results"):
                return {"available": None, "updated_at": None, "data": "No station found"}

            station_id = nearby_data["results"][0]["id"]
            # print("Nearest stationId:", station_id)

            # Step 2: Get real-time availability
            avail_url = "https://api.tomtom.com/search/2/chargingAvailability.json"
            params = {
                "key": api_key,
                "chargingAvailability": station_id,
                "minPowerKW": 1,
                "maxPowerKW": 100,
            }
            resp2 = requests.get(avail_url, params=params, timeout=5)
            resp2.raise_for_status()
            avail_data = resp2.json()
            # print("Availability response:", avail_data)

            # Simplified peek
            available = None
            updated_at = None

            ca = avail_data.get("chargingAvailability", {})
            connectors = avail_data.get("connectors", [])

            if connectors:
                free_count = sum(c.get("available", 0) for c in connectors)
                available = free_count > 0
                updated_at = datetime.datetime.utcnow().isoformat()

            result = {"available": available,
                      "updated_at": updated_at, "data": avail_data}

            # --- Cache store (10 min TTL) ---
            _station_cache[station_key] = {
                "data": result,
                "expiry": datetime.datetime.utcnow() + datetime.timedelta(minutes=10),
            }
            return result

        except Exception as e:
            return {"available": None, "updated_at": None, "data": f"Exception: {e}"}


# Global instance as expected by imports in Rasa actions
api_manager = ApiManager()
