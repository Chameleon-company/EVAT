import difflib
import logging
from typing import Any, Dict, Optional, Tuple


logger = logging.getLogger(__name__)


def get_location_coordinates(
    location_input: Any,
    charger_data: Any,
    csv_columns: Dict[str, str],
) -> Optional[Tuple[float, float]]:
    """Resolve a location using charging-station dataset information."""

    if not location_input:
        return None

    # Coordinates can be passed directly.
    if (
        isinstance(location_input, (tuple, list))
        and len(location_input) == 2
    ):
        try:
            lat = float(location_input[0])
            lon = float(location_input[1])

            if lat != 0 and lon != 0:
                logger.info(
                    "Using provided coordinates: (%s, %s)",
                    lat,
                    lon,
                )
                return lat, lon

        except (ValueError, TypeError):
            pass

    if not isinstance(location_input, str):
        return None

    location_clean = location_input.lower().strip()

    try:
        if charger_data is None or charger_data.empty:
            return None

        name_col = csv_columns["CHARGER_NAME"]
        address_col = csv_columns["ADDRESS"]
        suburb_col = csv_columns["SUBURB"]
        lat_col = csv_columns["LATITUDE"]
        lon_col = csv_columns["LONGITUDE"]

        # 1. Match by station name.
        try:
            mask = (
                charger_data[name_col]
                .astype(str)
                .str.lower()
                .str.contains(location_clean, na=False)
            )

            rows = charger_data[mask]

            if not rows.empty:
                row = rows.iloc[0]

                lat = float(row.get(lat_col, 0))
                lon = float(row.get(lon_col, 0))

                if lat != 0 and lon != 0:
                    logger.info(
                        "Found coordinates from station name: '%s' -> (%s, %s)",
                        row.get(name_col),
                        lat,
                        lon,
                    )
                    return lat, lon

        except Exception:
            pass

        # 2. Match by address.
        try:
            mask = (
                charger_data[address_col]
                .astype(str)
                .str.lower()
                .str.contains(location_clean, na=False)
            )

            rows = charger_data[mask]

            if not rows.empty:
                row = rows.iloc[0]

                lat = float(row.get(lat_col, 0))
                lon = float(row.get(lon_col, 0))

                if lat != 0 and lon != 0:
                    logger.info(
                        "Found coordinates from address: '%s' -> (%s, %s)",
                        row.get(address_col),
                        lat,
                        lon,
                    )
                    return lat, lon

        except Exception:
            pass

        # 3. Match by suburb.
        try:
            suburb_lower = (
                charger_data[suburb_col]
                .astype(str)
                .str.lower()
            )

            mask = (
                (suburb_lower == location_clean)
                | suburb_lower.str.contains(
                    location_clean,
                    na=False,
                )
            )

            rows = charger_data[mask]

            if not rows.empty:
                row = rows.iloc[0]

                lat = float(row.get(lat_col, 0))
                lon = float(row.get(lon_col, 0))

                if lat != 0 and lon != 0:
                    logger.info(
                        "Found coordinates from suburb: '%s' -> (%s, %s)",
                        row.get(suburb_col),
                        lat,
                        lon,
                    )
                    return lat, lon

        except Exception:
            pass

        # 4. Fuzzy match across name, address and suburb.
        try:
            candidates = []

            try:
                candidates.extend(
                    charger_data[name_col]
                    .dropna()
                    .astype(str)
                    .str.lower()
                    .tolist()
                )
            except Exception:
                pass

            try:
                candidates.extend(
                    charger_data[address_col]
                    .dropna()
                    .astype(str)
                    .str.lower()
                    .tolist()
                )
            except Exception:
                pass

            try:
                candidates.extend(
                    charger_data[suburb_col]
                    .dropna()
                    .astype(str)
                    .str.lower()
                    .tolist()
                )
            except Exception:
                pass

            best = difflib.get_close_matches(
                location_clean,
                list(set(candidates)),
                n=1,
                cutoff=0.6,
            )

            if best:
                best_string = best[0]

                mask = (
                    (
                        charger_data[name_col]
                        .astype(str)
                        .str.lower()
                        == best_string
                    )
                    | (
                        charger_data[address_col]
                        .astype(str)
                        .str.lower()
                        == best_string
                    )
                    | (
                        charger_data[suburb_col]
                        .astype(str)
                        .str.lower()
                        == best_string
                    )
                )

                rows = charger_data[mask]

                if not rows.empty:
                    row = rows.iloc[0]

                    lat = float(row.get(lat_col, 0))
                    lon = float(row.get(lon_col, 0))

                    if lat != 0 and lon != 0:
                        logger.info(
                            "Fuzzy-matched '%s' -> '%s' -> (%s, %s)",
                            location_clean,
                            best_string,
                            lat,
                            lon,
                        )
                        return lat, lon

        except Exception:
            pass

    except Exception:
        pass

    logger.warning(
        "Could not find coordinates for location: '%s'",
        location_input,
    )

    return None