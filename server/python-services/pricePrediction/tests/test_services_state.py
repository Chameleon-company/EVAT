import asyncio

import pytest
from fastapi import HTTPException

from pricePrediction import price_prediction_api as api


def test_health_reports_model_state():
    response = asyncio.run(api.health())

    assert response.status == "ok"
    assert isinstance(response.model_loaded, bool)
    assert response.feature_count == len(api.FEATURE_COLUMNS)


def test_model_info_returns_503_when_model_not_loaded():
    original_model = api.MODEL

    try:
        api.MODEL = None

        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(api.model_info())

        assert exc_info.value.status_code == 503
        assert exc_info.value.detail == "Model not loaded."
    finally:
        api.MODEL = original_model


def test_schema_returns_503_when_schema_not_loaded():
    original_columns = api.FEATURE_COLUMNS

    try:
        api.FEATURE_COLUMNS = []

        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(api.schema())

        assert exc_info.value.status_code == 503
        assert exc_info.value.detail == "Schema not loaded yet."
    finally:
        api.FEATURE_COLUMNS = original_columns