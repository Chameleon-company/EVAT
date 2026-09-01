import logging
from math import radians, sin, cos, sqrt, atan2
from typing import Any, Dict, List, Optional, Tuple

from backend.charging_station_service import get_charging_stations

try:
    from backend.real_time_apis import api_manager
    REAL_TIME_AVAILABLE = True
except ImportError:
    api_manager = None
    REAL_TIME_AVAILABLE = False


logger = logging.getLogger(__name__)


def get_route_stations(
    start_coords: Tuple[float, float],
    end_coords: Tuple[float, float],
    route_radius_km: float,
    max_results: int,
    earth_radius_km: float,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Find charging stations along a route.

    Returns:
        final_stations: stations ordered by preferred route position
        all_candidates: all stations inside the route corridor
    """

    logger.info(
        "Planning route from coordinates %s to %s",
        start_coords,
        end_coords,
    )

    route_info = None

    if REAL_TIME_AVAILABLE and api_manager is not None:
        try:
            route_info = api_manager.get_real_time_route(
                start_coords,
                end_coords,
            )

            if isinstance(route_info, dict):
                instructions = route_info.get("instructions") or []

                logger.info(
                    "Real-time route data: distance_km=%s "
                    "duration_min=%s delay_min=%s instructions_count=%s",
                    route_info.get("distance_km"),
                    route_info.get("duration_minutes"),
                    route_info.get("traffic_delay_minutes"),
                    len(instructions),
                )
            else:
                logger.warning(
                    "TomTom route data unavailable; using fallback route"
                )

        except Exception as error:
            logger.warning(
                "Real-time route data unavailable: %s",
                error,
            )
            route_info = None

    if route_info and route_info.get("source") == "tomtom":
        route_distance = float(route_info.get("distance_km", 0))

        logger.info(
            "Real-time route distance: %.1f km",
            route_distance,
        )

    else:
        route_distance = calculate_distance(
            start_coords,
            end_coords,
            earth_radius_km,
        )

        logger.info(
            "Calculated fallback route distance: %.1f km",
            route_distance,
        )

    final_stations, all_candidates = get_stations_along_route(
        start_coords=start_coords,
        end_coords=end_coords,
        route_distance=route_distance,
        route_info=route_info,
        route_radius_km=route_radius_km,
        max_results=max_results,
        earth_radius_km=earth_radius_km,
    )

    if final_stations:
        logger.info(
            "Found %s stations along route",
            len(final_stations),
        )
    else:
        logger.warning("No stations found along route")

    return final_stations, all_candidates


def get_stations_along_route(
    start_coords: Tuple[float, float],
    end_coords: Tuple[float, float],
    route_distance: float,
    route_info: Optional[Dict[str, Any]],
    route_radius_km: float,
    max_results: int,
    earth_radius_km: float,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Get stations strategically placed along the route."""

    search_radius = max(
        5.0,
        min(
            route_distance * 0.3,
            route_radius_km,
        ),
    )

    logger.info(
        "Route distance=%.2f km, search_radius=%.2f km",
        route_distance,
        search_radius,
    )

    polyline: Optional[List[Tuple[float, float]]] = None

    try:
        if route_info and isinstance(route_info.get("polyline"), list):
            raw_polyline = route_info.get("polyline") or []

            if len(raw_polyline) >= 2:
                polyline = [
                    (float(lat), float(lon))
                    for lat, lon in raw_polyline
                    if isinstance(lat, (int, float))
                    and isinstance(lon, (int, float))
                ]

    except Exception:
        polyline = None

    if not polyline:
        logger.warning(
            "No polyline available from real-time route; "
            "using straight-line fallback corridor"
        )

        polyline = [
            start_coords,
            end_coords,
        ]

    candidates: List[Dict[str, Any]] = []
    seen = set()

    sample_count = min(
        len(polyline),
        max(
            2,
            min(
                12,
                int(
                    route_distance
                    / max(search_radius, 1.0)
                )
                + 2,
            ),
        ),
    )

    if sample_count > 1:
        sample_indexes = sorted(
            {
                round(
                    i
                    * (len(polyline) - 1)
                    / (sample_count - 1)
                )
                for i in range(sample_count)
            }
        )
    else:
        sample_indexes = [0]

    for index in sample_indexes:
        try:
            sample_lat, sample_lon = polyline[index]

            stations, _ = get_charging_stations(
                latitude=sample_lat,
                longitude=sample_lon,
                distance_km=search_radius,
                limit=max_results,
            )

            for station in stations:
                key = (
                    str(
                        station.get("name", "")
                    ).strip().lower(),
                    round(
                        float(
                            station.get("latitude", 0)
                        ),
                        5,
                    ),
                    round(
                        float(
                            station.get("longitude", 0)
                        ),
                        5,
                    ),
                )

                if key not in seen:
                    seen.add(key)
                    candidates.append(station)

        except Exception as error:
            logger.warning(
                "Unable to retrieve stations at route sample: %s",
                error,
            )

    all_stations: List[Dict[str, Any]] = []

    for station in candidates:
        try:
            station_coords = (
                float(station.get("latitude")),
                float(station.get("longitude")),
            )

            min_perpendicular_distance = (
                min_perpendicular_distance_to_polyline(
                    polyline,
                    station_coords,
                    earth_radius_km,
                )
            )

            if (
                min_perpendicular_distance is not None
                and min_perpendicular_distance
                <= search_radius
            ):
                station_info = dict(station)

                station_info["distance_from_start"] = (
                    calculate_distance(
                        start_coords,
                        station_coords,
                        earth_radius_km,
                    )
                )

                station_info["distance_from_end"] = (
                    calculate_distance(
                        station_coords,
                        end_coords,
                        earth_radius_km,
                    )
                )

                all_stations.append(station_info)

        except (ValueError, TypeError):
            continue

    logger.info(
        "Candidate stations within route corridor: %s",
        len(all_stations),
    )

    if not all_stations:
        return [], []

    for station in all_stations:
        station["route_position_score"] = (
            calculate_route_position_score(
                station["distance_from_start"],
                route_distance,
            )
        )

    all_stations.sort(
        key=lambda station: station[
            "route_position_score"
        ]
    )

    return all_stations[:max_results], all_stations


def min_perpendicular_distance_to_polyline(
    polyline: List[Tuple[float, float]],
    point: Tuple[float, float],
    earth_radius_km: float,
) -> Optional[float]:
    """Calculate minimum distance from a point to a route polyline."""

    if not polyline or len(polyline) < 2:
        return None

    try:
        point_lat, point_lon = point
        point_lat_rad = radians(point_lat)
        point_lon_rad = radians(point_lon)

        reference_latitude = (
            sum(
                radians(lat)
                for lat, _ in polyline
            )
            / len(polyline)
        )

        cosine_reference = cos(
            reference_latitude
        )

        origin_lat_rad = radians(
            polyline[0][0]
        )

        origin_lon_rad = radians(
            polyline[0][1]
        )

        point_x = (
            point_lon_rad - origin_lon_rad
        ) * cosine_reference * earth_radius_km

        point_y = (
            point_lat_rad - origin_lat_rad
        ) * earth_radius_km

        minimum_distance = None

        previous_lat, previous_lon = (
            polyline[0]
        )

        for lat, lon in polyline[1:]:
            a_lat_rad = radians(previous_lat)
            a_lon_rad = radians(previous_lon)

            b_lat_rad = radians(lat)
            b_lon_rad = radians(lon)

            a_x = (
                a_lon_rad - origin_lon_rad
            ) * cosine_reference * earth_radius_km

            a_y = (
                a_lat_rad - origin_lat_rad
            ) * earth_radius_km

            b_x = (
                b_lon_rad - origin_lon_rad
            ) * cosine_reference * earth_radius_km

            b_y = (
                b_lat_rad - origin_lat_rad
            ) * earth_radius_km

            vector_x = b_x - a_x
            vector_y = b_y - a_y

            point_vector_x = point_x - a_x
            point_vector_y = point_y - a_y

            segment_length_squared = (
                vector_x * vector_x
                + vector_y * vector_y
            )

            if segment_length_squared <= 1e-9:
                distance_x = point_x - a_x
                distance_y = point_y - a_y

                distance = sqrt(
                    distance_x * distance_x
                    + distance_y * distance_y
                )

            else:
                position = (
                    point_vector_x * vector_x
                    + point_vector_y * vector_y
                ) / segment_length_squared

                if position < 0.0:
                    closest_x = a_x
                    closest_y = a_y

                elif position > 1.0:
                    closest_x = b_x
                    closest_y = b_y

                else:
                    closest_x = (
                        a_x
                        + position * vector_x
                    )

                    closest_y = (
                        a_y
                        + position * vector_y
                    )

                distance_x = (
                    point_x - closest_x
                )

                distance_y = (
                    point_y - closest_y
                )

                distance = sqrt(
                    distance_x * distance_x
                    + distance_y * distance_y
                )

            if (
                minimum_distance is None
                or distance < minimum_distance
            ):
                minimum_distance = distance

            previous_lat = lat
            previous_lon = lon

        return minimum_distance

    except Exception:
        return None


def calculate_route_position_score(
    distance_from_start: float,
    total_route_distance: float,
) -> float:
    """Score a station based on placement along the route."""

    if total_route_distance == 0:
        return 0

    position = (
        distance_from_start
        / total_route_distance
    )

    optimal_positions = [
        0.33,
        0.67,
    ]

    return min(
        abs(position - optimal_position)
        for optimal_position
        in optimal_positions
    )


def calculate_distance(
    point1: Tuple[float, float],
    point2: Tuple[float, float],
    earth_radius_km: float,
) -> float:
    """Calculate Haversine distance between two coordinates."""

    lat1, lon1 = point1
    lat2, lon2 = point2

    lat1, lon1, lat2, lon2 = map(
        radians,
        [lat1, lon1, lat2, lon2],
    )

    delta_latitude = lat2 - lat1
    delta_longitude = lon2 - lon1

    haversine_value = (
        sin(delta_latitude / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(delta_longitude / 2) ** 2
    )

    central_angle = 2 * atan2(
        sqrt(haversine_value),
        sqrt(1 - haversine_value),
    )

    return earth_radius_km * central_angle