from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Union, List
from datetime import date

import weatherAwareRouting.weatherAwareRouting
import personalisedEVInsights.personalisedEVInsights
import demandForecasting.demandForecasting

app = FastAPI()

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

#@app.get("/demandForecasting")

@app.post("/demandForecasting/predict", response_model=PredictionResponse)
def demandForecastingPredict(request: PredictionRequest):
    return demandForecasting.demandForecasting.handle_prediction(request)

@app.get("/demandForecasting/postcodes")
def demandForecasting_list_postcodes():
    return demandForecasting.demandForecasting.list_postcodes()