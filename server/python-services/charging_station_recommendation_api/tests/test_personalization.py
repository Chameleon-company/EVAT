from charging_station_recommendation_api.services.personalization import (
    _known_text,
    _mode,
)


def test_known_text_excludes_missing_sentinels_case_insensitively():
    assert _known_text(" Unknown ") is None
    assert _known_text("N/A") is None
    assert _known_text(None) is None


def test_mode_uses_only_known_text_values():
    assert _mode(["unknown", "OPERATOR A", " operator a ", "none"]) == "OPERATOR A"
    assert _mode(["unknown", "NONE", "null", None]) is None
