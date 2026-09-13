"""Trip Confidence Score orchestration layer.

EVAT has several independent services that each answer one narrow question:
weather-aware energy prediction, demand forecasting, charger reliability
scoring, EV-vs-ICE cost comparison, and CO2 savings. None of them talk to
each other, so a user planning a trip has to check several screens and
combine the numbers themselves.

This module asks all of them the same question -- "how confident should I
be about this trip?" -- and combines their answers into one composite score
with a human-readable breakdown, the same way
charging_station_recommendation_api/services/scoring.py combines factor
scores into one ranking score.

Design principle: any individual signal can fail independently (missing
Google Maps API key, no data for a given charger/postcode, optional vehicle
details not supplied) without failing the whole request. Each signal is
computed defensively; only the signals that succeeded are included, and
their weights are renormalised so the composite score always adds up to a
meaningful 0-100 value instead of crashing or silently under-scoring every
trip.
"""

from datetime import date as date_type
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

# Reused directly since these all run in the same combined FastAPI process.
import costComparison.costComparison as cost_comparison
import demandForecasting.demandForecasting as demand_forecasting
import weatherAwareRouting.weatherAwareRouting as weather_routing
from environmental_impact_analysis.predict import predict_savings
# reliability_scoring_api is deliberately NOT imported at module level -- see
# _reliability_factor() below.

# Assumed starting battery charge for this feature, since we don't currently
# collect the user's actual current battery level. This is deliberately NOT
# weatherAwareRouting.config.DEFAULT_SOC_PCT (10%) -- that constant is a
# conservative threshold used elsewhere for a "do you need to charge"
# warning, not a "how much charge does the driver actually start with"
# assumption. For a confidence score, assuming a full charge is the correct
# baseline: a trip consuming 5% should read as high confidence (95%
# remaining), and one consuming 80% should read as low confidence (20%
# remaining) -- not the other way around.
ASSUMED_STARTING_SOC_PCT = 100.0

# How much each signal counts toward the composite score when it's
# available. Renormalised at request time over whichever signals actually
# succeeded (see _combine).
BASE_WEIGHTS = {
    "energy": 0.30,
    "congestion": 0.20,
    "reliability": 0.25,
    "cost": 0.15,
    "environmental": 0.10,
}


class TripConfidenceRequest(BaseModel):
    # Route / energy (weatherAwareRouting)
    origin: str
    destination: str
    ac_on: bool = True

    # Congestion proxy (demandForecasting) -- postcode of the destination
    # charging area and the date the trip will happen.
    destination_postcode: str
    trip_date: date_type

    # Cost comparison
    distance_km: float
    electricity_price_per_kwh: float
    petrol_price_per_l: float
    ev_make: Optional[str] = None
    ev_model: Optional[str] = None
    ev_variant: Optional[str] = None
    ice_make: Optional[str] = None
    ice_model: Optional[str] = None
    ice_variant: Optional[str] = None

    # Reliability of the specific charger the user plans to use (optional --
    # skipped if not supplied or no data exists for that charger).
    charger_id: Optional[str] = None

    # Environmental impact (optional -- needs vehicle-comparison metadata
    # the caller may not always have on hand).
    environmental_impact_input: Optional[Dict[str, Any]] = None


class TripConfidenceFactor(BaseModel):
    name: str
    available: bool
    value: Optional[float] = None
    weight: float
    detail: Dict[str, Any] = {}
    reason: Optional[str] = None


class TripConfidenceResponse(BaseModel):
    confidence_score: float
    factors: List[TripConfidenceFactor]
    summary: str


def _safe_call(label: str, function, *args, **kwargs):
    """Run a sub-service call, never letting its failure break the whole request."""

    try:
        return function(*args, **kwargs), None
    except Exception as error:  # noqa: BLE001 - any sub-service failure degrades gracefully
        return None, f"{label} unavailable: {error}"


def _energy_factor(request: TripConfidenceRequest) -> TripConfidenceFactor:
    weight = BASE_WEIGHTS["energy"]

    trip_request = weather_routing.TripRequest(
        origin=request.origin,
        destination=request.destination,
        ac_on=request.ac_on,
    )
    result, error = _safe_call("weatherAwareRouting", weather_routing.predict, trip_request)

    if result is None:
        return TripConfidenceFactor(name="energy", available=False, weight=weight, reason=error)

    soc_needed = result.get("soc_with_contingency_pct")
    if soc_needed is None:
        return TripConfidenceFactor(
            name="energy", available=False, weight=weight, reason="No SOC estimate returned."
        )

    # soc_with_contingency_pct is how much battery the trip CONSUMES (with a
    # safety margin already built in) -- not how much is left on arrival.
    # Scoring it directly would invert the factor: a short trip using 5%
    # would score as low confidence and a route using 80-100% would score as
    # high confidence. Convert to actual remaining charge by subtracting the
    # required SOC from the assumed starting charge, then clamp to a valid
    # percentage.
    soc_remaining = max(0.0, min(100.0, ASSUMED_STARTING_SOC_PCT - soc_needed))
    value = soc_remaining / 100.0
    reason = f"Estimated {soc_remaining:.0f}% battery remaining on arrival."
    return TripConfidenceFactor(
        name="energy", available=True, value=value, weight=weight, detail=result, reason=reason
    )


def _congestion_factor(request: TripConfidenceRequest) -> TripConfidenceFactor:
    weight = BASE_WEIGHTS["congestion"]

    prediction_request = demand_forecasting.PredictionRequest(
        postcode=request.destination_postcode,
        date=request.trip_date,
    )
    result, error = _safe_call(
        "demandForecasting", demand_forecasting.handle_prediction, prediction_request
    )

    if result is None or result.get("status") != "success":
        reason = error or (result or {}).get("error") or "Prediction failed."
        return TripConfidenceFactor(name="congestion", available=False, weight=weight, reason=reason)

    predicted_kwh = result["predicted_demand_kwh"]

    # Postcode-level demand varies hugely by area (the training baseline
    # ranges from ~0 to ~12,600 kWh/day across postcodes), so a single
    # global "busy" threshold doesn't work. Instead, compare the forecast
    # against that specific postcode's own typical baseline: a forecast
    # well above its normal baseline signals unusually high demand for
    # that area specifically, regardless of the area's absolute size.
    baseline_kwh = demand_forecasting.postcode_baseline.loc[
        demand_forecasting.postcode_baseline["Postcode"] == request.destination_postcode,
        "baseline_daily_kwh",
    ]
    if baseline_kwh.empty or baseline_kwh.iloc[0] <= 0:
        return TripConfidenceFactor(
            name="congestion",
            available=False,
            weight=weight,
            reason=f"No baseline demand on record for postcode {request.destination_postcode}.",
        )

    baseline = baseline_kwh.iloc[0]
    demand_ratio = predicted_kwh / baseline
    # ratio <= 1 (at or below typical) -> full confidence; ratio >= 2 (double
    # the usual demand) -> treated as the low end of confidence.
    value = max(0.0, min(1.0, 1 - (demand_ratio - 1)))
    reason = (
        f"Forecast demand {predicted_kwh:.0f} kWh vs typical {baseline:.0f} kWh "
        f"for postcode {request.destination_postcode} on {request.trip_date}."
    )
    return TripConfidenceFactor(
        name="congestion", available=True, value=value, weight=weight, detail=result, reason=reason
    )


def _reliability_factor(request: TripConfidenceRequest) -> TripConfidenceFactor:
    weight = BASE_WEIGHTS["reliability"]

    if not request.charger_id:
        return TripConfidenceFactor(
            name="reliability", available=False, weight=weight, reason="No charger_id supplied."
        )

    # Imported here, not at module level. reliability_scoring_api pulls in
    # vaderSentiment, which is declared in its own requirements.txt but not
    # always present when this combined service is provisioned via the
    # root-level requirements file. A missing/broken import here must only
    # disable this one factor, not prevent the whole combined app -- and
    # every other endpoint in it -- from starting.
    try:
        import reliability_scoring_api.main as reliability_scoring
    except Exception as error:  # noqa: BLE001
        return TripConfidenceFactor(
            name="reliability",
            available=False,
            weight=weight,
            reason=f"reliabilityScoring unavailable: {error}",
        )

    station, error = _safe_call(
        "reliabilityScoring", reliability_scoring.get_station_data, request.charger_id
    )

    if station is None:
        reason = error or f"No reliability data on record for charger {request.charger_id}."
        return TripConfidenceFactor(name="reliability", available=False, weight=weight, reason=reason)

    reliability_score = station.get("reliability_score")
    if reliability_score is None:
        return TripConfidenceFactor(
            name="reliability", available=False, weight=weight, reason="No reliability score on record."
        )

    value = max(0.0, min(1.0, reliability_score / 100.0))
    reason = f"Charger reliability score: {reliability_score:.0f}/100."
    return TripConfidenceFactor(
        name="reliability", available=True, value=value, weight=weight, detail=station, reason=reason
    )


def _cost_factor(request: TripConfidenceRequest) -> TripConfidenceFactor:
    weight = BASE_WEIGHTS["cost"]

    predict_request = cost_comparison.PredictRequest(
        distance_km=request.distance_km,
        electricity_price_per_kwh=request.electricity_price_per_kwh,
        petrol_price_per_l=request.petrol_price_per_l,
        ev_make=request.ev_make,
        ev_model=request.ev_model,
        ev_variant=request.ev_variant,
        ice_make=request.ice_make,
        ice_model=request.ice_model,
        ice_variant=request.ice_variant,
    )
    result, error = _safe_call("costComparison", cost_comparison.predict, predict_request)

    if result is None:
        return TripConfidenceFactor(name="cost", available=False, weight=weight, reason=error)

    ev_cost = result.get("ev_trip_cost", 0.0)
    ice_cost = result.get("ice_trip_cost", 0.0)
    if ice_cost <= 0:
        value = 0.5
    else:
        savings_ratio = (ice_cost - ev_cost) / ice_cost
        value = max(0.0, min(1.0, 0.5 + savings_ratio))

    reason = f"Trip costs ${ev_cost:.2f} by EV vs ${ice_cost:.2f} by ICE."
    return TripConfidenceFactor(
        name="cost", available=True, value=value, weight=weight, detail=result, reason=reason
    )


def _environmental_factor(request: TripConfidenceRequest) -> TripConfidenceFactor:
    weight = BASE_WEIGHTS["environmental"]

    if not request.environmental_impact_input:
        return TripConfidenceFactor(
            name="environmental",
            available=False,
            weight=weight,
            reason="No vehicle-comparison details supplied.",
        )

    result, error = _safe_call(
        "environmentalImpact", predict_savings, request.environmental_impact_input
    )

    if result is None:
        return TripConfidenceFactor(name="environmental", available=False, weight=weight, reason=error)

    co2_savings = result.get("Predicted_CO2_Savings", 0.0)
    value = max(0.0, min(1.0, co2_savings / 200.0))
    reason = f"Predicted CO2 savings: {co2_savings:.1f}g/km vs the ICE comparison vehicle."
    return TripConfidenceFactor(
        name="environmental", available=True, value=value, weight=weight, detail=result, reason=reason
    )


def _combine(factors: List[TripConfidenceFactor]) -> float:
    """Weighted average over only the factors that were actually computed."""

    available = [factor for factor in factors if factor.available and factor.value is not None]
    if not available:
        return 0.0

    total_weight = sum(factor.weight for factor in available)
    if total_weight == 0:
        return 0.0

    weighted_sum = sum(factor.value * factor.weight for factor in available)
    return round((weighted_sum / total_weight) * 100, 1)


def compute_trip_confidence(request: TripConfidenceRequest) -> TripConfidenceResponse:
    factors = [
        _energy_factor(request),
        _congestion_factor(request),
        _reliability_factor(request),
        _cost_factor(request),
        _environmental_factor(request),
    ]

    score = _combine(factors)
    available_count = sum(1 for factor in factors if factor.available)
    summary = (
        f"{score:.0f}% confidence based on {available_count}/{len(factors)} available signals."
    )

    return TripConfidenceResponse(confidence_score=score, factors=factors, summary=summary)