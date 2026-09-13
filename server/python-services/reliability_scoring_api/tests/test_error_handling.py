import pytest

import reliability_scoring_api.main as api
from common.errors import (
    InvalidInputError,
    ResourceNotFoundError,
    ServiceUnavailableError,
)


def test_suburbs_hides_file_system_error(monkeypatch):
    def broken_get_suburbs():
        raise FileNotFoundError(
            "/secret/internal/path/reliability.csv"
        )

    monkeypatch.setattr(
        api,
        "get_suburbs",
        broken_get_suburbs,
    )

    with pytest.raises(
        ServiceUnavailableError
    ) as exc_info:
        api.suburbs()

    assert exc_info.value.status_code == 503
    assert exc_info.value.code == "SERVICE_UNAVAILABLE"

    assert exc_info.value.message == (
        "Reliability station data is currently unavailable."
    )

    assert (
        "/secret/internal/path"
        not in exc_info.value.message
    )


def test_missing_station_uses_not_found_error(
    monkeypatch,
):
    monkeypatch.setattr(
        api,
        "get_station_data",
        lambda charger_id: None,
    )

    with pytest.raises(
        ResourceNotFoundError
    ) as exc_info:
        api.get_station("TEST-123")

    assert exc_info.value.status_code == 404
    assert exc_info.value.code == "NOT_FOUND"

    assert exc_info.value.message == (
        "Station not found: TEST-123"
    )


def test_invalid_top_kind_uses_invalid_input_error():
    with pytest.raises(
        InvalidInputError
    ) as exc_info:
        api.top_stations(
            kind="unsupported",
            suburb=None,
            limit=5,
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "INVALID_INPUT"