"""
EVAT Chatbot Tool: compare_vehicle_costs

Follows the same pattern as find_nearby_chargers(): validate inputs, call the
EXISTING tested logic (model_runner), return only real data — never invents
a cost figure.

Reuses the same predict() function that already powers the Cost Comparison
feature's FastAPI endpoint, so the actual calculation logic isn't duplicated
or rebuilt — just wrapped for tool-calling.

model_runner trains its model in memory rather than loading a saved file, so
this module ensures that happens once (lazily) before the first prediction,
using a path resolved relative to model_runner.py itself rather than assuming
a specific working directory.
"""

import os
from typing import Optional
import model_runner

DEFAULT_EV_EFFICIENCY_KWH_PER_KM = 0.15
DEFAULT_ICE_EFFICIENCY_L_PER_100KM = 7.0


def _ensure_model_loaded():
    """Train the model once, on first use, if it hasn't been trained yet."""
    if model_runner._model is None:
        data_path = os.path.join(os.path.dirname(model_runner.__file__), "data", "dummy_data.csv")
        model_runner.load_and_train(data_path)


def compare_vehicle_costs(
    distance_km: float,
    electricity_price_per_kwh: float,
    petrol_price_per_l: float,
    ev_make: Optional[str] = None,
    ev_model: Optional[str] = None,
    ev_variant: Optional[str] = None,
    ice_make: Optional[str] = None,
    ice_model: Optional[str] = None,
    ice_variant: Optional[str] = None,
) -> dict:
    """
    EVAT Tool: compare the running cost of an EV vs a petrol vehicle for a trip.

    If a specific vehicle isn't given, falls back to a reasonable average
    efficiency figure rather than guessing at a specific model's numbers.
    """
    if distance_km <= 0:
        return {"error": "distance_km must be greater than 0.", "result": None}
    if electricity_price_per_kwh < 0 or petrol_price_per_l < 0:
        return {"error": "Prices cannot be negative.", "result": None}

    try:
        _ensure_model_loaded()

        if ev_make and ev_model:
            ev_efficiency = model_runner.get_ev_efficiency(ev_make, ev_model, ev_variant)
        else:
            ev_efficiency = DEFAULT_EV_EFFICIENCY_KWH_PER_KM

        if ice_make and ice_model:
            ice_efficiency = model_runner.get_ice_efficiency(ice_make, ice_model, ice_variant)
        else:
            ice_efficiency = DEFAULT_ICE_EFFICIENCY_L_PER_100KM

        result = model_runner.predict(
            distance_km=distance_km,
            electricity_price_per_kwh=electricity_price_per_kwh,
            ice_eff_l_per_100km=ice_efficiency,
            petrol_price_per_l=petrol_price_per_l,
            ev_kwh_per_km=ev_efficiency,
        )

        return {
            "query": {
                "distanceKm": distance_km,
                "electricityPricePerKwh": electricity_price_per_kwh,
                "petrolPricePerL": petrol_price_per_l,
                "evVehicle": f"{ev_make} {ev_model}".strip() if ev_make else "average EV",
                "iceVehicle": f"{ice_make} {ice_model}".strip() if ice_make else "average petrol vehicle",
            },
            "result": result,
        }

    except Exception as e:
        return {"error": str(e), "result": None}


if __name__ == "__main__":
    import json
    result = compare_vehicle_costs(
        distance_km=100,
        electricity_price_per_kwh=0.30,
        petrol_price_per_l=1.85,
    )
    print(json.dumps(result, indent=2))