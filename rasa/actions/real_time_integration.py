import os
import logging
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime

# Import the canonical backend implementation so all callers share one manager.
try:
    from backend.real_time_apis import api_manager
    REAL_TIME_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("Real-time APIs imported successfully")
except ImportError as e:
    REAL_TIME_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"Real-time APIs not available: {e}")

try:
    from .data_service import data_service
except Exception:
    data_service = None


class RealTimeIntegrationManager:
    """Manages real-time data integration for the chatbot"""

    def __init__(self):
        self.api_manager = api_manager if REAL_TIME_AVAILABLE else None
        self.logger = logging.getLogger(__name__)

    def is_available(self) -> bool:
        """Check if real-time APIs are available"""
        return REAL_TIME_AVAILABLE and self.api_manager is not None

    def get_user_location(self, location_name: str) -> Optional[Tuple[float, float]]:
        """Get user location coordinates from location name"""
        if not self.is_available():
            return None

        try:
            # CSV dataset lookup only
            if data_service is not None:
                coords = data_service._get_location_coordinates(location_name)
                if coords and isinstance(coords, tuple) and len(coords) == 2:
                    return coords  # type: ignore

            return None
        except Exception as e:
            self.logger.error(f"Error getting user location: {e}")
            return None

    def get_route_with_traffic(self, start_location: str, end_location: str) -> Optional[Dict[str, Any]]:
        """Get real-time route with traffic information"""
        if not self.is_available():
            return None

        try:
            # Get coordinates for start and end locations
            start_coords = self.get_user_location(start_location)
            end_coords = self.get_user_location(end_location)

            if not start_coords or not end_coords:
                return None

            # Get real-time route data
            route_info = self.api_manager.get_real_time_route(
                start_coords, end_coords)

            if route_info and route_info.get('source') == 'tomtom':
                return {
                    'distance_km': route_info.get('distance_km', 0),
                    'duration_minutes': route_info.get('duration_minutes', 0),
                    'traffic_delay_minutes': route_info.get('traffic_delay_minutes', 0),
                    'instructions': route_info.get('instructions', []),
                    'data_source': 'Real-time TomTom API'
                }

            return None

        except Exception as e:
            self.logger.error(f"Error getting route with traffic: {e}")
            return None

    """
    Removed unused get_stations_with_real_time_data.
    """

    def get_traffic_conditions(self, start_location: str, end_location: str) -> Optional[Dict[str, Any]]:
        """Get real-time traffic conditions for a route"""
        if not self.is_available():
            return None

        try:
            start_coords = self.get_user_location(start_location)
            end_coords = self.get_user_location(end_location)

            if not start_coords or not end_coords:
                return None

            traffic_info = self.api_manager.get_real_time_traffic(
                start_coords, end_coords)

            if traffic_info and traffic_info.get('source') == 'tomtom':
                return {
                    'current_speed_kmh': traffic_info.get('current_speed_kmh', 0),
                    'free_flow_speed_kmh': traffic_info.get('free_flow_speed_kmh', 0),
                    'congestion_level': traffic_info.get('congestion_level', 0),
                    'traffic_status': traffic_info.get('traffic_status', 'Unknown'),
                    'estimated_delay_minutes': traffic_info.get('estimated_delay_minutes', 0),
                    'data_source': 'Real-time TomTom API'
                }

            return None

        except Exception as e:
            self.logger.error(f"Error getting traffic conditions: {e}")
            return None

    # Weather integration removed

    """
    Removed unused _format_real_time_stations.
    """

    def get_enhanced_route_planning(self, start_location: str, end_location: str) -> Dict[str, Any]:
        """Get comprehensive route planning with real-time data"""
        result = {
            'success': False,
            'route_info': None,
            'traffic_info': None,
            'data_source': 'No real-time data available'
        }

        if not self.is_available():
            result['message'] = "Real-time APIs not available"
            return result

        try:
            # Get route information
            route_info = self.get_route_with_traffic(
                start_location, end_location)
            if route_info:
                result['route_info'] = route_info
                result['data_source'] = 'Real-time TomTom API'

            # Get traffic conditions
            traffic_info = self.get_traffic_conditions(
                start_location, end_location)
            if traffic_info:
                result['traffic_info'] = traffic_info

            # Weather removed from aggregation
            if route_info or traffic_info:
                result['success'] = True
                result['message'] = "Real-time data retrieved successfully"
            else:
                result['message'] = "No real-time data available"

        except Exception as e:
            self.logger.error(f"Error in enhanced route planning: {e}")
            result['message'] = f"Error retrieving real-time data: {str(e)}"

        return result


# Global instance
real_time_manager = RealTimeIntegrationManager()
