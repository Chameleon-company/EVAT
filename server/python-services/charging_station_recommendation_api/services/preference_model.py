"""Loads the trained personalised-preference model and scores candidates with it."""

from pathlib import Path
from typing import List, Optional

import joblib
import pandas as pd

from charging_station_recommendation_api.models.request import ChargingStationCandidate
from charging_station_recommendation_api.training.preprocessing import (
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES,
)

_MISSING_TEXT_VALUES = {"", "none", "null", "nan", "n/a", "na"}
_PAY_AT_LOCATION_YES = {"yes", "y", "true", "1"}
_PAY_AT_LOCATION_NO = {"no", "n", "false", "0"}

MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "training"
    / "model_output"
    / "preference_model.joblib"
)


def safe_float(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def clean_text(value) -> str:
    if value is None:
        return "unknown"
    text = str(value).strip().lower()
    return "unknown" if text in _MISSING_TEXT_VALUES else text


def clean_pay_at_location(value) -> str:
    if value is None:
        return "unknown"
    if isinstance(value, bool):
        return "yes" if value else "no"
    text = str(value).strip().lower()
    if text in _PAY_AT_LOCATION_YES:
        return "yes"
    if text in _PAY_AT_LOCATION_NO:
        return "no"
    return "unknown"


def _load_model():
    if not MODEL_PATH.exists():
        return None
    try:
        return joblib.load(MODEL_PATH)
    except Exception as error:  # noqa: BLE001
        print(f"[preference_model] Failed to load {MODEL_PATH}: {error}")
        return None


MODEL = _load_model()


def is_model_available() -> bool:
    return MODEL is not None


def _candidate_to_row(candidate: ChargingStationCandidate) -> dict:
    row = {
        feature: safe_float(getattr(candidate, feature, None))
        for feature in NUMERIC_FEATURES
    }
    row["payAtLocation"] = clean_pay_at_location(getattr(candidate, "payAtLocation", None))
    row["roadTrafficCondition"] = clean_text(getattr(candidate, "roadTrafficCondition", None))
    row["operator"] = clean_text(getattr(candidate, "operator", None))
    return row


def predict_selection_probability(
    candidates: List[ChargingStationCandidate],
) -> Optional[List[float]]:
    if MODEL is None or not candidates:
        return None

    frame = pd.DataFrame(
        [_candidate_to_row(candidate) for candidate in candidates],
        columns=NUMERIC_FEATURES + CATEGORICAL_FEATURES,
    )

    try:
        probabilities = MODEL.predict_proba(frame)[:, 1]
    except Exception as error:  # noqa: BLE001
        print(f"[preference_model] Inference failed, falling back to heuristic: {error}")
        return None

    return [float(probability) for probability in probabilities]