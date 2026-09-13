import pytest

import weatherAwareRouting.weatherAwareRouting as api
from common.errors import ResourceNotFoundError


def test_missing_route_uses_not_found_error(monkeypatch):
    monkeypatch.setattr(
        api,
        "get_route",
        lambda origin, destination: None,
    )

    request = api.TripRequest(
        origin="Melbourne",
        destination="Geelong",
    )

    with pytest.raises(
        ResourceNotFoundError
    ) as exc_info:
        api.predict(request)

    assert exc_info.value.status_code == 404
    assert exc_info.value.code == "NOT_FOUND"
    assert exc_info.value.message == (
        "No route found. Check both addresses."
    )