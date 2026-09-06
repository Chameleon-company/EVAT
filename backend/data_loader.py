import logging
from functools import lru_cache
from pathlib import Path
from typing import Tuple

import pandas as pd

from backend.config import DATA_CONFIG


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]


@lru_cache(maxsize=1)
def load_datasets() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load EVAT charger and coordinate datasets for shared backend use."""

    charger_path = PROJECT_ROOT / DATA_CONFIG["CHARGER_CSV_PATH"]
    coordinates_path = PROJECT_ROOT / DATA_CONFIG["COORDINATES_CSV_PATH"]

    if charger_path.exists():
        charger_data = pd.read_csv(charger_path)
        logger.info(
            "Loaded %s charging stations from dataset",
            len(charger_data),
        )
    else:
        logger.error("Charger dataset not found at %s", charger_path)
        charger_data = pd.DataFrame()

    if coordinates_path.exists():
        coordinates_data = pd.read_csv(coordinates_path)
        logger.info(
            "Loaded %s suburb coordinates from dataset",
            len(coordinates_data),
        )
    else:
        logger.warning(
            "Coordinates dataset not found - charger data will be used "
            "for location resolution"
        )
        coordinates_data = pd.DataFrame()

    return charger_data, coordinates_data
