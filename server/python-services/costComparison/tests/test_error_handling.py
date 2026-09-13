import pytest

import costComparison.costComparison as api
from common.errors import PredictionError


class DummyPredictRequest:
    distance_km = 100.0
    electricity_price_per_kwh = 0.30
    petrol_price_per_l = 2.00

    ev_make = None
    ev_model = None
    ev_variant = None

    ice_make = None
    ice_model = None
    ice_variant = None


def test_predict_converts_internal_error_to_prediction_error(monkeypatch):
    def broken_predict(*args, **kwargs):
        raise RuntimeError("SECRET_COST_MODEL_FAILURE")

    monkeypatch.setattr(
        api.costComparison.model_runner,
        "predict",
        broken_predict,
    )

    with pytest.raises(PredictionError) as exc_info:
        api.predict(DummyPredictRequest())

    assert exc_info.value.status_code == 500
    assert exc_info.value.code == "PREDICTION_ERROR"
    assert exc_info.value.message == (
        "Cost comparison prediction could not be generated."
    )

    assert "SECRET_COST_MODEL_FAILURE" not in exc_info.value.message

def test_ev_vehicle_failure_is_standardised(monkeypatch):
    def broken_vehicle_lookup():
        raise RuntimeError("SECRET_EV_DATA_FAILURE")

    monkeypatch.setattr(
        api.costComparison.model_runner,
        "get_ev_vehicles",
        broken_vehicle_lookup,
    )

    with pytest.raises(PredictionError) as exc_info:
        api.ev_vehicles()

    assert exc_info.value.status_code == 500
    assert exc_info.value.code == "PREDICTION_ERROR"
    assert exc_info.value.message == (
        "EV vehicle data could not be retrieved."
    )

    assert "SECRET_EV_DATA_FAILURE" not in exc_info.value.message