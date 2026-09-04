"""
Price Prediction API

FastAPI service for predicting car prices from enriched feature inputs.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
import logging

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pricePrediction.price_app_config import (
    PRICE_ALT_DATA_PATH,
    PRICE_DATA_PATH,
    PRICE_FEATURE_DICT_PATH,
    PRICE_MODEL_PATH,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


MODEL = None
FEATURE_COLUMNS: List[str] = []
NUMERIC_COLUMNS: List[str] = []
CATEGORICAL_COLUMNS: List[str] = []
FEATURE_DESCRIPTIONS: Dict[str, str] = {}
SCHEMA_SOURCE: Optional[str] = None
FEATURE_DEFAULTS: Dict[str, Any] = {}
MILEAGE_BIN_HELPER = None
ENGINE_BIN_HELPER = None
MILEAGE_HIGH: Optional[float] = None
MILEAGE_VERY_HIGH: Optional[float] = None
ENGINE_SIZE_BY_BRAND_MODEL: Dict[Tuple[str, str], float] = {}
ENGINE_SIZE_BY_FUEL: Dict[str, float] = {}
DEFAULT_ENGINE_SIZE: float = 2.5

CONDITION_SCORES = {"used": 1, "like new": 2, "new": 3}

# Core inputs expected from the UI / README examples
USER_INPUT_COLUMNS = {
    "Brand",
    "Model",
    "Year",
    "Mileage",
    "Engine Size",
    "Fuel Type",
    "Transmission",
    "Condition",
}


class PredictionRequest(BaseModel):
    row_id: Optional[Union[str, int]] = Field(default=None)
    features: Dict[str, Any] = Field(..., description="Raw feature inputs")
    auto_derive: bool = Field(
        default=True,
        description="Derive engineered features and fill enrichment defaults when missing",
    )


class PredictionRecord(BaseModel):
    row_id: Optional[Union[str, int]] = Field(default=None)
    features: Dict[str, Any] = Field(..., description="Raw feature inputs")
    auto_derive: bool = Field(default=True)


class PredictionResponse(BaseModel):
    row_id: Optional[Union[str, int]]
    predicted_log_price: float
    predicted_price: float
    missing_features: List[str]
    extra_features: List[str]
    derived_features: List[str] = Field(default_factory=list)


class BatchPredictionRequest(BaseModel):
    records: List[PredictionRecord]


class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    count: int
    timestamp: datetime


class SchemaResponse(BaseModel):
    feature_columns: List[str]
    numeric_columns: List[str]
    categorical_columns: List[str]
    feature_descriptions: Dict[str, str]
    schema_source: Optional[str]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    timestamp: datetime
    feature_count: int


class ModelInfoResponse(BaseModel):
    model_type: str
    pipeline_steps: List[str]
    n_features_in: Optional[int]
    schema_source: Optional[str]


def _get_model_feature_names(model) -> Optional[List[str]]:
    if hasattr(model, "feature_names_in_"):
        return list(model.feature_names_in_)
    if hasattr(model, "named_steps"):
        preprocess = model.named_steps.get("preprocess")
        if preprocess is not None and hasattr(preprocess, "feature_names_in_"):
            return list(preprocess.feature_names_in_)
    return None


def _load_feature_descriptions() -> Dict[str, str]:
    if not PRICE_FEATURE_DICT_PATH.exists():
        return {}
    try:
        df = pd.read_csv(PRICE_FEATURE_DICT_PATH)
        if "column" in df.columns:
            column_col = "column"
        elif "feature" in df.columns:
            column_col = "feature"
        else:
            return {}
        desc_col = "description" if "description" in df.columns else None
        if desc_col is None:
            return {}
        return (
            df[[column_col, desc_col]]
            .dropna(subset=[column_col])
            .set_index(column_col)[desc_col]
            .fillna("")
            .to_dict()
        )
    except Exception as exc:
        logger.warning("Feature dictionary load failed: %s", exc)
        return {}


def _load_data_schema() -> Tuple[Optional[List[str]], List[str], Optional[str]]:
    data_path = None
    for candidate in [PRICE_DATA_PATH, PRICE_ALT_DATA_PATH]:
        if candidate.exists():
            data_path = candidate
            break
    if data_path is None:
        return None, [], None

    df = pd.read_csv(data_path, nrows=500)
    drop_cols = [c for c in ["Price", "Log_Price", "Car ID"] if c in df.columns]
    feature_cols = [c for c in df.columns if c not in drop_cols]
    numeric_cols = (
        df[feature_cols].select_dtypes(include=["number"]).columns.tolist()
        if feature_cols
        else []
    )
    return feature_cols, numeric_cols, str(data_path)


def _coerce_numeric(df: pd.DataFrame) -> pd.DataFrame:
    for col in NUMERIC_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def _is_missing(value: Any) -> bool:
    if value is None:
        return True
    try:
        return bool(pd.isna(value))
    except Exception:
        return False


def _safe_float(value: Any) -> Optional[float]:
    try:
        if _is_missing(value):
            return None
        return float(value)
    except Exception:
        return None


def _safe_int(value: Any) -> Optional[int]:
    try:
        if _is_missing(value):
            return None
        return int(float(value))
    except Exception:
        return None


def _infer_default_values(df: pd.DataFrame, feature_cols: List[str]) -> Dict[str, Any]:
    defaults: Dict[str, Any] = {}
    for col in feature_cols:
        if col not in df.columns:
            continue
        series = df[col]
        if pd.api.types.is_numeric_dtype(series):
            value = series.dropna().median()
            defaults[col] = float(value) if not _is_missing(value) else None
        else:
            mode = series.dropna().mode()
            defaults[col] = mode.iloc[0] if not mode.empty else None
    return defaults


def _build_bin_helper(df: pd.DataFrame, value_col: str, bin_col: str):
    if value_col not in df.columns or bin_col not in df.columns:
        return None
    series = df[value_col].dropna()
    if series.empty:
        return None
    quantiles = series.quantile([0.0, 0.33, 0.66, 1.0]).values
    edges = np.unique(quantiles)
    if len(edges) < 4:
        return None
    bins = pd.cut(df[value_col], bins=edges, include_lowest=True)
    mapping: Dict[Any, Any] = {}
    for interval in bins.cat.categories:
        mask = bins == interval
        labels = df.loc[mask, bin_col].dropna().mode()
        if not labels.empty:
            mapping[interval] = labels.iloc[0]
    if not mapping:
        return None
    return edges, mapping


def _map_to_bin(value: Optional[float], helper) -> Optional[Any]:
    if helper is None or value is None:
        return None
    edges, mapping = helper
    clipped = min(max(value, edges[0]), edges[-1])
    interval = pd.cut([clipped], bins=edges, include_lowest=True)[0]
    return mapping.get(interval)


def _resolve_engine_size(
    brand: Any,
    model: Any,
    fuel_type: Any,
    engine_size: Optional[float],
) -> Tuple[Optional[float], bool]:
    """
    Return (engine_size, was_filled).
    For non-EV, treat missing/0 as invalid and fill from training medians.
    For EV, keep 0 / provided value.
    """
    is_ev = str(fuel_type or "").strip().lower() == "electric"
    if is_ev:
        return (0.0 if engine_size is None else engine_size), engine_size is None

    if engine_size is not None and engine_size > 0:
        return engine_size, False

    brand_key = str(brand).strip() if brand is not None and not _is_missing(brand) else ""
    model_key = str(model).strip() if model is not None and not _is_missing(model) else ""
    fuel_key = str(fuel_type).strip() if fuel_type is not None and not _is_missing(fuel_type) else ""

    if brand_key and model_key and (brand_key, model_key) in ENGINE_SIZE_BY_BRAND_MODEL:
        return ENGINE_SIZE_BY_BRAND_MODEL[(brand_key, model_key)], True
    if fuel_key and fuel_key in ENGINE_SIZE_BY_FUEL:
        return ENGINE_SIZE_BY_FUEL[fuel_key], True
    return DEFAULT_ENGINE_SIZE, True


def _derive_features(features: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    """Derive engineered fields and fill enrichment defaults (Streamlit dashboard logic)."""
    updated = dict(FEATURE_DEFAULTS)
    updated.update({k: v for k, v in features.items() if not _is_missing(v)})
    derived: List[str] = []
    reference_year = datetime.utcnow().year

    def set_derived(key: str, value: Any, force: bool = False) -> None:
        if key not in FEATURE_COLUMNS:
            return
        if not force and key in features and not _is_missing(features.get(key)):
            return
        updated[key] = value
        if key not in derived:
            derived.append(key)

    year_value = _safe_int(updated.get("Year"))
    car_age = _safe_int(updated.get("car_age"))
    if car_age is None and year_value is not None:
        car_age = max(reference_year - year_value, 0)
        set_derived("car_age", car_age)

    if car_age is not None:
        set_derived("age_squared", car_age**2)
        set_derived("car_age_sq", car_age**2)

    mileage = _safe_float(updated.get("Mileage"))
    if mileage is not None:
        set_derived("log_mileage", float(np.log1p(mileage)))
    if mileage is not None and car_age is not None:
        per_year = mileage if car_age <= 0 else mileage / max(car_age, 1)
        set_derived("mileage_per_year", per_year)

    brand = updated.get("Brand")
    model = updated.get("Model")
    fuel_type = updated.get("Fuel Type")
    transmission = updated.get("Transmission")
    condition = updated.get("Condition")

    raw_engine = _safe_float(updated.get("Engine Size"))
    engine_size, engine_filled = _resolve_engine_size(brand, model, fuel_type, raw_engine)
    if engine_filled:
        set_derived("Engine Size", engine_size, force=True)
    elif engine_size is not None:
        updated["Engine Size"] = engine_size

    if engine_size is not None and mileage is not None:
        set_derived("engine_size_per_mileage", engine_size / max(mileage, 1.0))

    if condition is not None and not _is_missing(condition):
        score = CONDITION_SCORES.get(str(condition).strip().lower())
        if score is not None:
            set_derived("condition_score", score)
    else:
        # Default condition when omitted
        set_derived("Condition", "Used", force=True)
        condition = "Used"
        set_derived("condition_score", CONDITION_SCORES["used"])

    if mileage is not None:
        mileage_bin = _map_to_bin(mileage, MILEAGE_BIN_HELPER)
        if mileage_bin is not None:
            set_derived("mileage_bin", mileage_bin)
            set_derived("mileage_band", mileage_bin)

    if engine_size is not None:
        engine_bin = _map_to_bin(engine_size, ENGINE_BIN_HELPER)
        if engine_bin is not None:
            set_derived("engine_size_bin", engine_bin)

    mileage_bin_value = updated.get("mileage_bin") or updated.get("mileage_band")
    if condition is not None and not _is_missing(condition) and mileage_bin_value is not None:
        set_derived("condition_mileage_bin", f"{condition}_{mileage_bin_value}")

    if brand and model and not _is_missing(brand) and not _is_missing(model):
        set_derived("brand_model", f"{brand}_{model}")

    if (
        fuel_type
        and transmission
        and not _is_missing(fuel_type)
        and not _is_missing(transmission)
    ):
        set_derived("fuel_transmission", f"{fuel_type}_{transmission}")

    if mileage is not None and condition is not None and not _is_missing(condition):
        if MILEAGE_HIGH is not None:
            set_derived(
                "new_high_mileage_flag",
                int(str(condition).strip().lower() == "new" and mileage > MILEAGE_HIGH),
            )
        if MILEAGE_VERY_HIGH is not None:
            set_derived(
                "very_new_very_high_mileage_flag",
                int(
                    str(condition).strip().lower() == "new"
                    and mileage > MILEAGE_VERY_HIGH
                ),
            )

    if fuel_type is not None and not _is_missing(fuel_type):
        is_ev = str(fuel_type).strip().lower() == "electric"
        if engine_size is not None:
            set_derived("ev_engine_size_mismatch_flag", int(is_ev and engine_size > 0.1))
        if transmission is not None and not _is_missing(transmission):
            set_derived(
                "manual_ev_flag",
                int(is_ev and str(transmission).strip().lower() == "manual"),
            )

    # Mark enrichment defaults that came from training data (not user input)
    for key, value in FEATURE_DEFAULTS.items():
        if key in USER_INPUT_COLUMNS:
            continue
        if key not in FEATURE_COLUMNS:
            continue
        if key in features and not _is_missing(features.get(key)):
            continue
        if key in derived:
            continue
        if value is not None and not _is_missing(value):
            updated[key] = value
            derived.append(key)

    return updated, derived


def _normalize_features(
    features: Dict[str, Any],
    auto_derive: bool = True,
) -> Tuple[Dict[str, Any], List[str], List[str], List[str]]:
    provided = {
        k: v for k, v in features.items() if k in FEATURE_COLUMNS and not _is_missing(v)
    }
    derived: List[str] = []
    working = dict(features)

    if auto_derive:
        working, derived = _derive_features(features)

    extra = [c for c in features.keys() if c not in FEATURE_COLUMNS]
    missing = [c for c in FEATURE_COLUMNS if c not in provided and c not in derived]
    normalized = {c: working.get(c, np.nan) for c in FEATURE_COLUMNS}
    # Treat still-empty as missing
    still_missing = [
        c
        for c in FEATURE_COLUMNS
        if _is_missing(normalized.get(c))
    ]
    return normalized, still_missing, extra, derived


async def startup_event() -> None:
    global MODEL, FEATURE_COLUMNS, NUMERIC_COLUMNS, CATEGORICAL_COLUMNS
    global FEATURE_DESCRIPTIONS, SCHEMA_SOURCE
    global FEATURE_DEFAULTS, MILEAGE_BIN_HELPER, ENGINE_BIN_HELPER
    global MILEAGE_HIGH, MILEAGE_VERY_HIGH
    global ENGINE_SIZE_BY_BRAND_MODEL, ENGINE_SIZE_BY_FUEL, DEFAULT_ENGINE_SIZE

    try:
        MODEL = joblib.load(PRICE_MODEL_PATH)
        logger.info("Model loaded: %s", type(MODEL).__name__)
    except Exception as exc:
        logger.error("Failed to load model at %s: %s", PRICE_MODEL_PATH, exc)
        raise

    data_feature_cols, data_numeric_cols, data_source = _load_data_schema()
    model_feature_cols = _get_model_feature_names(MODEL)

    if model_feature_cols:
        FEATURE_COLUMNS = model_feature_cols
        SCHEMA_SOURCE = "model"
    elif data_feature_cols:
        FEATURE_COLUMNS = data_feature_cols
        SCHEMA_SOURCE = "data"
    else:
        raise RuntimeError("Unable to determine feature schema from model or data.")

    if data_numeric_cols:
        NUMERIC_COLUMNS = [c for c in data_numeric_cols if c in FEATURE_COLUMNS]
    else:
        NUMERIC_COLUMNS = []

    CATEGORICAL_COLUMNS = [c for c in FEATURE_COLUMNS if c not in NUMERIC_COLUMNS]

    if data_source and SCHEMA_SOURCE == "model":
        SCHEMA_SOURCE = f"model (data fallback at {data_source})"
    elif data_source:
        SCHEMA_SOURCE = f"data ({data_source})"

    FEATURE_DESCRIPTIONS = _load_feature_descriptions()

    # Load training data helpers for auto-derive / enrichment defaults
    data_path = None
    for candidate in [PRICE_DATA_PATH, PRICE_ALT_DATA_PATH]:
        if candidate.exists():
            data_path = candidate
            break
    if data_path is not None:
        preview_df = pd.read_csv(data_path)
        drop_cols = [c for c in ["Price", "Log_Price", "Car ID"] if c in preview_df.columns]
        feature_cols = [c for c in preview_df.columns if c not in drop_cols]
        FEATURE_DEFAULTS = _infer_default_values(preview_df, feature_cols)
        MILEAGE_BIN_HELPER = _build_bin_helper(preview_df, "Mileage", "mileage_bin")
        if MILEAGE_BIN_HELPER is None:
            MILEAGE_BIN_HELPER = _build_bin_helper(preview_df, "Mileage", "mileage_band")
        ENGINE_BIN_HELPER = _build_bin_helper(preview_df, "Engine Size", "engine_size_bin")
        if "Mileage" in preview_df.columns:
            mileage_series = preview_df["Mileage"].dropna()
            if not mileage_series.empty:
                MILEAGE_HIGH = float(mileage_series.quantile(0.75))
                MILEAGE_VERY_HIGH = float(mileage_series.quantile(0.9))

        if {"Brand", "Model", "Engine Size"}.issubset(preview_df.columns):
            grouped = (
                preview_df.groupby(["Brand", "Model"])["Engine Size"]
                .median()
                .dropna()
            )
            ENGINE_SIZE_BY_BRAND_MODEL = {
                (str(brand), str(model)): float(value)
                for (brand, model), value in grouped.items()
                if float(value) > 0
            }

        if {"Fuel Type", "Engine Size"}.issubset(preview_df.columns):
            fuel_grouped = preview_df.groupby("Fuel Type")["Engine Size"].median().dropna()
            ENGINE_SIZE_BY_FUEL = {
                str(fuel): float(value)
                for fuel, value in fuel_grouped.items()
                if float(value) > 0
            }
            if "Petrol" in ENGINE_SIZE_BY_FUEL:
                DEFAULT_ENGINE_SIZE = ENGINE_SIZE_BY_FUEL["Petrol"]
            elif ENGINE_SIZE_BY_FUEL:
                DEFAULT_ENGINE_SIZE = next(iter(ENGINE_SIZE_BY_FUEL.values()))

        logger.info("Feature defaults loaded from %s", data_path)

    logger.info("Feature schema loaded: %d features", len(FEATURE_COLUMNS))


async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=MODEL is not None,
        timestamp=datetime.utcnow(),
        feature_count=len(FEATURE_COLUMNS),
    )


async def schema() -> SchemaResponse:
    if not FEATURE_COLUMNS:
        raise HTTPException(status_code=503, detail="Schema not loaded yet.")
    return SchemaResponse(
        feature_columns=FEATURE_COLUMNS,
        numeric_columns=NUMERIC_COLUMNS,
        categorical_columns=CATEGORICAL_COLUMNS,
        feature_descriptions=FEATURE_DESCRIPTIONS,
        schema_source=SCHEMA_SOURCE,
    )


async def model_info() -> ModelInfoResponse:
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    steps = list(getattr(MODEL, "named_steps", {}).keys())
    n_features_in = getattr(MODEL, "n_features_in_", None)
    return ModelInfoResponse(
        model_type=type(MODEL).__name__,
        pipeline_steps=steps,
        n_features_in=n_features_in,
        schema_source=SCHEMA_SOURCE,
    )


def _predict(records: List[PredictionRecord]) -> List[PredictionResponse]:
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    if not FEATURE_COLUMNS:
        raise HTTPException(status_code=503, detail="Schema not loaded yet.")

    normalized_rows: List[Dict[str, Any]] = []
    missing_list: List[List[str]] = []
    extra_list: List[List[str]] = []
    derived_list: List[List[str]] = []

    for record in records:
        normalized, missing, extra, derived = _normalize_features(
            record.features, auto_derive=record.auto_derive
        )
        normalized_rows.append(normalized)
        missing_list.append(missing)
        extra_list.append(extra)
        derived_list.append(derived)

    df = pd.DataFrame(normalized_rows, columns=FEATURE_COLUMNS)
    df = _coerce_numeric(df)

    pred_log = MODEL.predict(df)
    pred_price = np.maximum(0, np.expm1(pred_log))

    responses: List[PredictionResponse] = []
    for idx, record in enumerate(records):
        responses.append(
            PredictionResponse(
                row_id=record.row_id,
                predicted_log_price=float(pred_log[idx]),
                predicted_price=float(pred_price[idx]),
                missing_features=missing_list[idx],
                extra_features=extra_list[idx],
                derived_features=derived_list[idx],
            )
        )
    return responses


async def predict(request: PredictionRequest) -> PredictionResponse:
    record = PredictionRecord(
        row_id=request.row_id,
        features=request.features,
        auto_derive=request.auto_derive,
    )
    responses = _predict([record])
    return responses[0]


async def predict_batch(request: BatchPredictionRequest) -> BatchPredictionResponse:
    predictions = _predict(request.records)
    return BatchPredictionResponse(
        predictions=predictions,
        count=len(predictions),
        timestamp=datetime.utcnow(),
    )
