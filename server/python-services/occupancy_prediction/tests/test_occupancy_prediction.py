from occupancy_prediction.occupancy_prediction import predict


def test_predict_identifies_busy_and_off_peak_hours():
    result = predict(
        {
            "station_id": "station-1",
            "time": "15:00",
            "historical_occupancy": {
                "8": 1,
                "9": 1,
                "10": 1,
                "14": 4,
                "15": 4,
                "16": 4,
            },
        }
    )

    assert result["status"] == "success"
    assert result["station_id"] == "station-1"
    assert result["predicted_occupancy"] == 100.0
    assert result["busy_hours"] == [14, 15, 16]
    assert result["off_peak_hours"] == [8, 9, 10]
    assert "14:00-17:00" in result["recommendation"]
    assert "8:00-11:00" in result["recommendation"]


def test_predict_returns_low_confidence_for_empty_history():
    result = predict(
        {
            "station_id": "station-2",
            "historical_occupancy": {},
        }
    )

    assert result == {
        "status": "success",
        "station_id": "station-2",
        "predicted_occupancy": 0.0,
        "busy_hours": [],
        "off_peak_hours": [],
        "recommendation": "Insufficient historical data to predict occupancy.",
        "confidence": 0.0,
    }


def test_predict_uses_average_for_an_hour_without_history():
    result = predict(
        {
            "station_id": "station-3",
            "time": "12:00",
            "historical_occupancy": {"8": 2, "9": 4},
        }
    )

    assert result["predicted_occupancy"] == 75.0
    assert result["busy_hours"] == []
