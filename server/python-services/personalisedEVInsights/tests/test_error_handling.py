import pytest

import personalisedEVInsights.personalisedEVInsights as api
from common.errors import InvalidInputError


def test_invalid_payload_raises_standard_invalid_input_error():
    with pytest.raises(InvalidInputError) as exc_info:
        api.predict("invalid payload")

    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "INVALID_INPUT"
    assert exc_info.value.message == "Invalid JSON payload."


def test_prediction_runtime_error_is_not_converted_to_raw_http_error(
    monkeypatch,
):
    def broken_predict(*args, **kwargs):
        raise RuntimeError("SECRET_PERSONALISED_MODEL_FAILURE")

    monkeypatch.setattr(
        api.kproto,
        "predict",
        broken_predict,
    )

    payload = {
        "weekly_km": 150,
        "fuel_efficiency": 7.5,
        "monthly_fuel_spend": 200,
    }

    with pytest.raises(RuntimeError) as exc_info:
        api.predict(payload)

    assert str(exc_info.value) == (
        "SECRET_PERSONALISED_MODEL_FAILURE"
    )