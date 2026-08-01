from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Union, List, Optional
from datetime import date
from contextlib import asynccontextmanager

import weatherAwareRouting.weatherAwareRouting
import personalisedEVInsights.personalisedEVInsights
import demandForecasting.demandForecasting
import costComparison.costComparison
import costComparison.model_runner

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[startup] Training model...")
    costComparison.model_runner.load_and_train("costComparison/data/dummy_data.csv")
    print("[startup] Model ready.")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API Running"}

# =============================================================
# Weather Aware Routing Use Case
class TripRequest(BaseModel):
    origin: str
    destination: str
    ac_on: bool = True

@app.post("/weatherAwareRouting/predict")
def weatherAwareRoutingPredict(req: TripRequest):
    return weatherAwareRouting.weatherAwareRouting.predict(req)

# =============================================================
# Personalised EV Usage Insights Use Case
@app.post("/personalisedEVInsights/predict")
def personalisedEVInsightsPredict(payload: Union[dict, List[dict]]):
    return personalisedEVInsights.personalisedEVInsights.predict(payload)

# =============================================================
# Demand Forecasting Use Case
class PredictionRequest(BaseModel):
    postcode: str
    date: date  # Expects "YYYY-MM-DD" format

    @field_validator('postcode')
    @classmethod
    def validate_postcode(cls, v):
        # Remove any whitespace and ensure it's a string
        return str(v).strip()
    
class PredictionResponse(BaseModel):
    postcode: str
    date: str
    predicted_demand_kwh: float
    status: str

@app.get("/demandForecasting/coords/{postcode}")
def demandForecasting_get_postcode_coords(postcode: str):
    return demandForecasting.demandForecasting.get_postcode_coords(postcode)

@app.post("/demandForecasting/predict", response_model=PredictionResponse)
def demandForecastingPredict(request: PredictionRequest):
    return demandForecasting.demandForecasting.handle_prediction(request)

@app.get("/demandForecasting/postcodes")
def demandForecasting_list_postcodes():
    return demandForecasting.demandForecasting.list_postcodes()

# =============================================================
# Cost Comparison Use Case
class PredictRequest(BaseModel):
    distance_km: float
    electricity_price_per_kwh: float
    petrol_price_per_l: float
    ev_make: Optional[str] = None
    ev_model: Optional[str] = None
    ev_variant: Optional[str] = None
    ice_make: Optional[str] = None
    ice_model: Optional[str] = None
    ice_variant: Optional[str] = None

class VehicleEfficiencyRequest(BaseModel):
    make: str
    model: str
    variant: Optional[str] = None

@app.post("/costComparison/predict")
def costComparisonPredict(req: PredictRequest):
    return costComparison.costComparison.predict(req)

@app.post("/costComparison/charts")
def costComparisonCharts(req: PredictRequest):
    return costComparison.costComparison.charts(req)

@app.get("/costComparison/vehicles/ev")
def costComparisonEv_vehicles():
    return costComparison.costComparison.ev_vehicles()

@app.get("/costComparison/vehicles/ice")
def costComparisonIce_vehicles():
    return costComparison.costComparison.ice_vehicles()

@app.post("/costComparison/vehicles/ev/efficiency")
def costComparisonEv_efficiency(req: VehicleEfficiencyRequest):
    return costComparison.costComparison.ev_efficiency(req)

@app.post("/costComparison/vehicles/ice/efficiency")
def costComparisonIce_efficiency(req: VehicleEfficiencyRequest):
    return costComparison.costComparison.ice_efficiency(req)

