from pricePrediction import price_prediction_api as api


def test_safe_float_returns_float_for_valid_number():
    assert api._safe_float("12.5") == 12.5


def test_safe_float_returns_none_for_invalid_value():
    assert api._safe_float("not-a-number") is None


def test_safe_int_converts_numeric_string():
    assert api._safe_int("2024") == 2024


def test_ev_without_engine_size_defaults_to_zero():
    engine_size, filled = api._resolve_engine_size(
        brand="Tesla",
        model="Model 3",
        fuel_type="Electric",
        engine_size=None,
    )

    assert engine_size == 0.0
    assert filled is True


def test_non_ev_missing_engine_size_uses_fallback():
    original_default = api.DEFAULT_ENGINE_SIZE

    try:
        api.DEFAULT_ENGINE_SIZE = 2.5

        engine_size, filled = api._resolve_engine_size(
            brand="Unknown",
            model="Unknown",
            fuel_type="Petrol",
            engine_size=None,
        )

        assert engine_size == 2.5
        assert filled is True
    finally:
        api.DEFAULT_ENGINE_SIZE = original_default