import pytest

from personalisedEVInsights.scoring import calculate_suitability


def payload(**overrides):
    values = {
        "weekly_km": 300,
        "fuel_efficiency": 8.0,
        "monthly_fuel_spend": 300,
        "home_charging": "Yes",
        "solar_panels": "Yes",
        "charging_preference": "Home",
        "budget": "$60,000-$80,000",
        "priorities": "Affordability, Environmental impact",
        "road_trips": "No",
        "car_ownership": "Yes - Petrol",
    }
    values.update(overrides)
    return values


def test_high_suitability_user_receives_full_ev_recommendation():
    result = calculate_suitability(payload())

    assert result["evReadinessScore"] >= 70
    assert result["recommendationCategory"] == "Full EV Recommended"
    assert result["estimatedAnnualSavings"] > 0
    assert result["estimatedAnnualCo2ReductionKg"] > 0
    assert sum(
        value for key, value in result["scoreComponents"].items() if key != "roadTripPenalty"
    ) - result["scoreComponents"]["roadTripPenalty"] == pytest.approx(
        result["evReadinessScore"], abs=1
    )


def test_low_usage_without_charging_access_is_optional():
    result = calculate_suitability(
        payload(
            weekly_km=20,
            monthly_fuel_spend=30,
            home_charging="No",
            solar_panels="No",
            charging_preference="Public stations",
            budget="<$40,000",
            priorities="Affordability",
            road_trips="Yes",
        )
    )

    assert result["evReadinessScore"] < 45
    assert result["recommendationCategory"] == "EV Optional"
    assert result["scoreComponents"]["roadTripPenalty"] == 5


def test_existing_ev_owner_does_not_receive_switching_benefits():
    result = calculate_suitability(payload(car_ownership="Yes - Electric"))

    assert result["estimatedAnnualSavings"] == 0
    assert result["estimatedAnnualCo2ReductionKg"] == 0
    assert "already drive an EV" in result["personalisedPredictionInsight"]


def test_invalid_numeric_input_is_rejected():
    with pytest.raises(ValueError, match="weekly_km cannot be negative"):
        calculate_suitability(payload(weekly_km=-1))
