import personalisedEVInsights.personalisedEVInsights as api


def payload(**overrides):
    values = {
        "weekly_km": 300,
        "trip_length": "Mostly medium trips (10-50 km)",
        "driving_frequency": "Daily",
        "driving_type": "A mix of city/suburban and highway driving",
        "road_trips": "No",
        "car_ownership": "Yes - Petrol",
        "fuel_efficiency": 8.0,
        "monthly_fuel_spend": 300,
        "home_charging": "Yes",
        "solar_panels": "Yes",
        "charging_preference": "Home",
        "budget": "$60,000-$80,000",
        "priorities": "Affordability, Environmental impact",
        "postcode": "3000",
    }
    values.update(overrides)
    return values


def test_single_prediction_returns_cluster_and_matching_suitability(monkeypatch):
    monkeypatch.setattr(api.kproto, "predict", lambda *args, **kwargs: [2])

    result = api.predict(payload())

    assert result["cluster"] == 2
    assert result["suitability"]["recommendationCategory"] == (
        "Full EV Recommended"
    )
    assert result["suitability"]["annualKm"] == 15_600


def test_batch_prediction_preserves_record_alignment(monkeypatch):
    monkeypatch.setattr(api.kproto, "predict", lambda *args, **kwargs: [1, 3])

    result = api.predict(
        [
            payload(),
            payload(
                weekly_km=20,
                monthly_fuel_spend=30,
                home_charging="No",
                solar_panels="No",
                charging_preference="Public stations",
                budget="<$40,000",
                priorities="Affordability",
                road_trips="Yes",
            ),
        ]
    )

    assert result["clusters"] == [1, 3]
    assert [item["recommendationCategory"] for item in result["suitability"]] == [
        "Full EV Recommended",
        "EV Optional",
    ]
