import asyncio
import pytest

from pricePrediction import price_prediction_api as api


@pytest.fixture(scope="session")
def loaded_price_api():
    asyncio.run(api.startup_event())
    return api