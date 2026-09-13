"""Ensure committed model artifacts can be deserialized in the locked environment."""

import pickle
from pathlib import Path

import joblib


SERVICES_DIR = Path(__file__).resolve().parents[1]


def test_demand_forecasting_model_loads():
    model = joblib.load(SERVICES_DIR / "demandForecasting" / "ev_demand_model.pkl")

    assert hasattr(model, "predict")


def test_environmental_impact_model_loads():
    model = joblib.load(
        SERVICES_DIR / "environmental_impact_analysis" / "co2_savings_model.pkl"
    )

    assert hasattr(model, "predict")


def test_price_prediction_model_loads():
    model = joblib.load(
        SERVICES_DIR
        / "pricePrediction"
        / "artifacts"
        / "price_best_model_latest.joblib"
    )

    assert hasattr(model, "predict")


def test_personalised_insights_model_loads():
    bundle_path = SERVICES_DIR / "personalisedEVInsights" / "kproto_bundle.pkl"
    with bundle_path.open("rb") as bundle_file:
        bundle = pickle.load(bundle_file)

    assert hasattr(bundle["model"], "predict")
