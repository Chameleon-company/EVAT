from datetime import date, timedelta

import pytest

import demandForecasting.demandForecasting as api
from common.errors import (
    InvalidInputError,
    ResourceNotFoundError,
)


def test_unknown_postcode_uses_not_found_error(
    monkeypatch,
):
    monkeypatch.setattr(
        api,
        "postcode_coords",
        {},
    )

    with pytest.raises(
        ResourceNotFoundError
    ) as exc_info:
        api.get_postcode_coords("9999")

    assert exc_info.value.status_code == 404
    assert exc_info.value.code == "NOT_FOUND"

    assert exc_info.value.message == (
        "Postcode '9999' not found."
    )


def test_past_date_uses_invalid_input_error(
    monkeypatch,
):
    request = api.PredictionRequest(
        postcode="2000",
        date=date.today() - timedelta(days=1),
    )

    monkeypatch.setattr(
        api,
        "predict_demand",
        lambda postcode, target_date: {
            "postcode": postcode,
            "date": target_date.isoformat(),
            "error": (
                "Cannot fetch forecast for past dates."
            ),
            "status": "error",
        },
    )

    with pytest.raises(
        InvalidInputError
    ) as exc_info:
        api.handle_prediction(request)

    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "INVALID_INPUT"

    assert exc_info.value.message == (
        "Cannot fetch forecast for past dates."
    )


def test_unexpected_prediction_error_is_not_swallowed(
    monkeypatch,
):
    def broken_predict(*args, **kwargs):
        raise RuntimeError(
            "SECRET_DEMAND_MODEL_FAILURE"
        )

    monkeypatch.setattr(
        api.model,
        "predict",
        broken_predict,
    )

    postcode = str(
        api.postcode_baseline.iloc[0]["Postcode"]
    )

    monkeypatch.setitem(
        api.postcode_coords,
        postcode,
        (-33.8688, 151.2093),
    )

    monkeypatch.setattr(
        api,
        "get_weather_forecast",
        lambda *args, **kwargs: 20.0,
    )

    with pytest.raises(RuntimeError) as exc_info:
        api.predict_demand(
            postcode,
            date.today() + timedelta(days=1),
        )

    assert str(exc_info.value) == (
        "SECRET_DEMAND_MODEL_FAILURE"
    )