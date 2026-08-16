"""Smoke tests for the Python application entry points."""


def test_combined_application_imports(monkeypatch):
    # googlemaps validates the key prefix during client construction. This is a
    # deliberately non-secret placeholder; the smoke test makes no API calls.
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "AIza-test-key")

    from main import app

    assert app is not None


def test_reliability_application_imports():
    from reliability_scoring_api.main import app

    assert app is not None
