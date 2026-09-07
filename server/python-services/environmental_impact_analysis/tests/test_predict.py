import math
import pytest

from environmental_impact_analysis.predict import load_model, predict_savings


VALID_INPUT = {
    "Make_EV": "Tesla",
    "Make_ICE": "Toyota",
    "BodyStyle_EV": "SUV",
    "BodyStyle_ICE": "SUV",
    "FuelType_ICE": "Petrol95",
    "YearDiff": 5,
    "ICE_CO2_Baseline": 220.4,
}


def test_model_loads_successfully():
    model = load_model()

    assert model is not None


def test_valid_input_returns_expected_response_structure():
    result = predict_savings(VALID_INPUT)

    assert isinstance(result, dict)
    assert "Predicted_CO2_Savings" in result


def test_prediction_is_numeric_and_finite():
    result = predict_savings(VALID_INPUT)
    prediction = result["Predicted_CO2_Savings"]

    assert isinstance(prediction, float)
    assert math.isfinite(prediction)


def test_missing_required_fields_raises_error():
    invalid_input = {
        "Make_EV": "Tesla"
    }

    with pytest.raises(ValueError):
        predict_savings(invalid_input)