import asyncio
import math

from pricePrediction import price_prediction_api as api


VALID_FEATURES = {
    "Brand": "Toyota",
    "Model": "Corolla",
    "Year": 2020,
    "Mileage": 50000,
    "Engine Size": 1.8,
    "Fuel Type": "Petrol",
    "Transmission": "Automatic",
    "Condition": "Used",
}

def test_single_prediction_returns_valid_response(loaded_price_api):
    request = api.PredictionRequest(
        row_id="test-1",
        features=VALID_FEATURES,
        auto_derive=True,
    )

    response = asyncio.run(api.predict(request))

    assert response.row_id == "test-1"
    assert isinstance(response.predicted_log_price, float)
    assert isinstance(response.predicted_price, float)
    assert math.isfinite(response.predicted_price)
    assert response.predicted_price >= 0
    assert isinstance(response.missing_features, list)
    assert isinstance(response.extra_features, list)
    assert isinstance(response.derived_features, list)


def test_batch_prediction_returns_correct_count(loaded_price_api):
    request = api.BatchPredictionRequest(
        records=[
            api.PredictionRecord(
                row_id="car-1",
                features=VALID_FEATURES,
                auto_derive=True,
            ),
            api.PredictionRecord(
                row_id="car-2",
                features=VALID_FEATURES,
                auto_derive=True,
            ),
        ]
    )

    response = asyncio.run(api.predict_batch(request))

    assert response.count == 2
    assert len(response.predictions) == 2
    assert response.predictions[0].row_id == "car-1"
    assert response.predictions[1].row_id == "car-2"


def test_prediction_reports_extra_features(loaded_price_api):
    features = dict(VALID_FEATURES)
    features["UnexpectedField"] = "test"

    request = api.PredictionRequest(
        features=features,
        auto_derive=True,
    )

    response = asyncio.run(api.predict(request))

    assert "UnexpectedField" in response.extra_features