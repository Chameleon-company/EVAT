import os
import pickle
from pathlib import Path
import numpy as np
import pandas as pd
from typing import Union, List
from fastapi import HTTPException

# Load the bundle (model + metadata)
SERVICE_DIR = Path(__file__).resolve().parent
with (SERVICE_DIR / "kproto_bundle.pkl").open("rb") as f:
    bundle = pickle.load(f)

kproto = bundle["model"]
FEATURE_COLS = bundle["feature_cols"]
CAT_COLS = bundle["cat_cols"]  # indices relative to FEATURE_COLS

def coerce_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure numeric fields are numeric and category fields are strings.
    Missing fields are filled with empty strings for categoricals and 0 for numerics.
    Adjust this mapping if your training schema changes.
    """
    numeric_cols = ["weekly_km", "fuel_efficiency", "monthly_fuel_spend"]
    categorical_cols = [c for c in FEATURE_COLS if c not in numeric_cols]

    # Ensure columns exist; add missing as NaN/empty
    for col in FEATURE_COLS:
        if col not in df.columns:
            df[col] = np.nan

    # Type coercion
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    for col in categorical_cols:
        # Keep exact strings used in training (e.g., "Yes", "No", "Home", etc.)
        df[col] = df[col].fillna("").astype(str)

    # Reorder columns to match training
    df = df[FEATURE_COLS]
    return df

def predict(payload: Union[dict, List[dict]]):
    """
    Expect JSON body containing at least the fields in FEATURE_COLS.
    Extra fields are ignored.
    Returns: {"cluster": <int>}
    """
    try:

        # Accept single object or list of objects; standardise to list
        if isinstance(payload, dict):
            records = [payload]
            single = True
        elif isinstance(payload, list):
            records = payload
            single = False
        else:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        df = pd.DataFrame(records)
        df = coerce_types(df)

        # Convert to numpy with mixed types; kmodes handles categoricals as strings
        X = df.to_numpy()

        # Predict
        clusters = kproto.predict(X, categorical=CAT_COLS)
        # Return single prediction if input was a single object
        if single:
            return {"cluster": int(clusters[0])}
        else:
            return {"clusters": [int(c) for c in clusters]}

    except HTTPException:
        raise
    except HTTPException as e:
        raise HTTPException(status_code=500, detail=str(e))
