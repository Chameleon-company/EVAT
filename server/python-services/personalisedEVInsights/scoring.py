"""Transparent first-stage EV suitability scoring for 013S1.

The score is a decision-support heuristic, not a prediction of observed EV
adoption. Keeping the assumptions and component scores in the response makes
the recommendation auditable and suitable for dashboards.
"""

from typing import Any, Dict


ANNUAL_WEEKS = 52
MONTHS_PER_YEAR = 12
EV_ENERGY_KWH_PER_KM = 0.18
GRID_CO2_KG_PER_KWH = 0.65
SOLAR_CO2_KG_PER_KWH = 0.05
PETROL_CO2_KG_PER_LITRE = 2.31
DIESEL_CO2_KG_PER_LITRE = 2.68

EV_COST_PER_KM = {
    "solar": 0.02,
    "home": 0.04,
    "work": 0.05,
    "public": 0.07,
}


def _text(value: Any) -> str:
    return str(value or "").strip().lower()


def _number(payload: Dict[str, Any], key: str) -> float:
    try:
        value = float(payload.get(key, 0))
    except (TypeError, ValueError) as error:
        raise ValueError(f"{key} must be a number") from error
    if value < 0:
        raise ValueError(f"{key} cannot be negative")
    return value


def _charging_profile(payload: Dict[str, Any]) -> str:
    if (
        _text(payload.get("solar_panels")) == "yes"
        and _text(payload.get("home_charging")) == "yes"
    ):
        return "solar"

    preference = _text(payload.get("charging_preference"))
    if "home" in preference:
        return "home"
    if "work" in preference:
        return "work"
    return "public"


def _budget_score(value: Any) -> float:
    budget = _text(value).replace(" ", "")
    if budget.startswith(">") or "over" in budget:
        return 10.0
    if budget.startswith("$60,000") or budget.startswith("$60k"):
        return 8.0
    if budget.startswith("$40,000") or budget.startswith("$40k"):
        return 6.0
    if "<" in budget or "under" in budget:
        return 3.0
    return 4.0


def _recommendation(score: int) -> str:
    if score >= 70:
        return "Full EV Recommended"
    if score >= 45:
        return "Hybrid Recommended"
    return "EV Optional"


def calculate_suitability(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Return financial, environmental, and readiness estimates for one user."""

    weekly_km = _number(payload, "weekly_km")
    fuel_efficiency = _number(payload, "fuel_efficiency")
    monthly_fuel_spend = _number(payload, "monthly_fuel_spend")
    annual_km = weekly_km * ANNUAL_WEEKS

    ownership = _text(payload.get("car_ownership"))
    comparison_applies = "electric" not in ownership and "don't own" not in ownership

    charging_profile = _charging_profile(payload)
    annual_ev_charging_cost = annual_km * EV_COST_PER_KM[charging_profile]
    annual_fuel_cost = monthly_fuel_spend * MONTHS_PER_YEAR
    annual_savings = max(0.0, annual_fuel_cost - annual_ev_charging_cost)

    fuel_factor = DIESEL_CO2_KG_PER_LITRE if "diesel" in ownership else PETROL_CO2_KG_PER_LITRE
    annual_ice_co2 = annual_km * (fuel_efficiency / 100) * fuel_factor
    electricity_factor = SOLAR_CO2_KG_PER_KWH if charging_profile == "solar" else GRID_CO2_KG_PER_KWH
    annual_ev_co2 = annual_km * EV_ENERGY_KWH_PER_KM * electricity_factor
    annual_co2_reduction = max(0.0, annual_ice_co2 - annual_ev_co2)

    if not comparison_applies:
        annual_savings = 0.0
        annual_co2_reduction = 0.0

    driving_score = min(20.0, weekly_km / 15.0)
    financial_score = min(25.0, annual_savings / 100.0)

    home_charging = _text(payload.get("home_charging"))
    charging_score = 20.0 if home_charging == "yes" else 10.0 if home_charging == "not sure" else 4.0
    preference = _text(payload.get("charging_preference"))
    if "home" in preference:
        charging_score += 5.0
    elif "work" in preference:
        charging_score += 3.0
    charging_score = min(25.0, charging_score)

    solar_score = (
        10.0
        if _text(payload.get("solar_panels")) == "yes" and home_charging == "yes"
        else 0.0
    )
    environmental_score = 10.0 if "environmental impact" in _text(payload.get("priorities")) else 0.0
    budget_score = _budget_score(payload.get("budget"))

    road_trip_penalty = 5.0 if _text(payload.get("road_trips")) == "yes" and home_charging == "no" else 0.0
    readiness_score = round(
        max(
            0.0,
            min(
                100.0,
                driving_score
                + financial_score
                + charging_score
                + solar_score
                + environmental_score
                + budget_score
                - road_trip_penalty,
            ),
        )
    )

    category = _recommendation(readiness_score)
    if "electric" in ownership:
        insight = "You already drive an EV. Your responses indicate how practical your current charging setup is."
    elif "don't own" in ownership:
        insight = "You do not currently own a car, so switching-cost and emissions estimates are not applicable."
    elif category == "Full EV Recommended":
        insight = "Your driving, savings potential, and charging access indicate strong EV suitability."
    elif category == "Hybrid Recommended":
        insight = "Your responses indicate moderate EV suitability; a hybrid may reduce charging or long-trip constraints."
    else:
        insight = "EV adoption is optional for your current usage; improve charging access or compare total ownership costs first."

    return {
        "evReadinessScore": readiness_score,
        "recommendationCategory": category,
        "annualKm": round(annual_km, 1),
        "estimatedAnnualFuelCost": round(annual_fuel_cost, 2),
        "estimatedAnnualEvChargingCost": round(annual_ev_charging_cost, 2),
        "estimatedAnnualSavings": round(annual_savings, 2),
        "estimatedAnnualCo2ReductionKg": round(annual_co2_reduction, 2),
        "personalisedPredictionInsight": insight,
        "scoreComponents": {
            "drivingDemand": round(driving_score, 1),
            "financialBenefit": round(financial_score, 1),
            "chargingPracticality": round(charging_score, 1),
            "solarAccess": round(solar_score, 1),
            "environmentalPriority": round(environmental_score, 1),
            "budgetReadiness": round(budget_score, 1),
            "roadTripPenalty": round(road_trip_penalty, 1),
        },
        "assumptions": {
            "chargingProfile": charging_profile,
            "evEnergyKwhPerKm": EV_ENERGY_KWH_PER_KM,
            "evCostPerKm": EV_COST_PER_KM[charging_profile],
            "electricityCo2KgPerKwh": electricity_factor,
        },
    }
