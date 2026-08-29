from pydantic import BaseModel
from typing import List, Dict

# ========================================
# Weather Aware Routing
class WAR_TripRequest(BaseModel):
    origin: str
    destination: str
    ac_on: bool = True

class WAR_Coordinates(BaseModel):
    lat: float
    lng: float

class WAR_RouteStep(BaseModel):
    instruction: str
    distance_m: int
    duration_s: int
    start_location: WAR_Coordinates
    end_location: WAR_Coordinates

class WAR_Weather(BaseModel):
    temp_c: float
    wind_deg: float
    wind_speed_ms: float

class WAR_ChargingStop(BaseModel):
    address: str
    lat: float
    lng: float
    name: str
    open_now: bool
    place_id: str
    rating: float

class WAR_RouteResponse(BaseModel):
    origin_resolved: str
    destination_resolved: str
    origin_coords: WAR_Coordinates
    destination_coords: WAR_Coordinates
    distance_km: float
    duration_min: float
    duration_in_traffic_min: float
    traffic_condition: str
    polyline: str
    steps: List[WAR_RouteStep]
    weather: WAR_Weather
    charging_required: bool
    charging_stops: List[WAR_ChargingStop]

# ========================================
# Personalised EV Usage Insights
class PEVUI_Response(BaseModel):
    cluster: int | List[int]

# ========================================
# Demand Forecasting
class DF_Postcode(BaseModel):
    postcode: str
    lat: float
    lon: float

class DF_ListPostcodes(BaseModel):
    count: int
    postcodes: List[str]

# ========================================
# Cost Comparison
class CC_Model_Predict(BaseModel):
    predicted_savings: float
    ev_trip_cost: float
    ice_trip_cost: float
    ev_co2_kg: float
    ice_co2_kg: float
    co2_saved_kg: float
    currency: str
    model_version: str

class CC_Vehicle(BaseModel):
    vehicles: dict[str, dict[str, list[str]]]

class CC_Forecast_10yr(BaseModel):
    year: int
    predicted_savings: float

class CC_Feature_Importance(BaseModel):
    feature: str
    importance: float

class CC_Parity(BaseModel):
    actual: float
    predicted: float

class CC_Charts(BaseModel):
    forecast_10yr: List[CC_Forecast_10yr]
    multi_scenario: List[Dict[str, float | int]]
    feature_importance: List[CC_Feature_Importance]
    parity: List[CC_Parity]
    scenario_keys: List[str]

class CC_Efficiency(BaseModel):
    efficiency_kwh_per_km: float