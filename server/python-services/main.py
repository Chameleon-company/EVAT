from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, Field
from typing import Union, List, Optional, Dict, Any
from datetime import date, datetime
from contextlib import asynccontextmanager

import weatherAwareRouting.weatherAwareRouting
import personalisedEVInsights.personalisedEVInsights
import demandForecasting.demandForecasting
import costComparison.costComparison
import costComparison.model_runner
import pricePrediction.price_prediction_api
import charging_station_recommendation_api.main
import reliability_scoring_api.main as reliability_scoring
from charging_station_recommendation_api.models.request import RankChargingStationsRequest
from charging_station_recommendation_api.models.response import RankChargingStationsResponse
from environmental_impact_analysis.predict import predict_savings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[startup] Training model...")
    costComparison.model_runner.load_and_train("costComparison/data/dummy_data.csv")

    print("[startup] Loading price prediction model...")
    await pricePrediction.price_prediction_api.startup_event()

    print("[startup] Loading reliability scoring data...")
    reliability_scoring.initialize()

    print("[startup] Models ready.")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================
# Reliability Scoring Use Case
app.include_router(reliability_scoring.router, prefix="/reliability")

@app.get("/")
def root():
    return {"message": "API Running"}

# =============================================================
# Weather Aware Routing Use Case
class WARTripRequest(BaseModel):
    origin: str
    destination: str
    ac_on: bool = True

@app.post("/weatherAwareRouting/predict")
def weatherAwareRoutingPredict(req: WARTripRequest):
    return weatherAwareRouting.weatherAwareRouting.predict(req)

# =============================================================
# Personalised EV Usage Insights Use Case
@app.post("/personalisedEVInsights/predict")
def personalisedEVInsightsPredict(payload: Union[dict, List[dict]]):
    return personalisedEVInsights.personalisedEVInsights.predict(payload)

# =============================================================

# Environmental Impact Analysis Use Case

class EnvironmentalImpactPredictionRequest(BaseModel):
    Make_EV: str
    Make_ICE: str
    BodyStyle_EV: str
    BodyStyle_ICE: str
    FuelType_ICE: str
    YearDiff: int
    ICE_CO2_Baseline: float


@app.post("/environmentalImpact/predict")
def environmentalImpactPredict(req: EnvironmentalImpactPredictionRequest):
    return predict_savings(req.model_dump())

# =============================================================
# Demand Forecasting Use Case
class DFPredictionRequest(BaseModel):
    postcode: str
    date: date  # Expects "YYYY-MM-DD" format

    @field_validator('postcode')
    @classmethod
    def validate_postcode(cls, v):
        # Remove any whitespace and ensure it's a string
        return str(v).strip()
    
class DFPredictionResponse(BaseModel):
    postcode: str
    date: str
    predicted_demand_kwh: float
    status: str

@app.get("/demandForecasting/coords/{postcode}")
def demandForecasting_get_postcode_coords(postcode: str):
    return demandForecasting.demandForecasting.get_postcode_coords(postcode)

@app.post("/demandForecasting/predict", response_model=DFPredictionResponse)
def demandForecastingPredict(request: DFPredictionRequest):
    return demandForecasting.demandForecasting.handle_prediction(request)

@app.get("/demandForecasting/postcodes")
def demandForecasting_list_postcodes():
    return demandForecasting.demandForecasting.list_postcodes()

# =============================================================
# Cost Comparison Use Case
class CCPredictRequest(BaseModel):
    distance_km: float
    electricity_price_per_kwh: float
    petrol_price_per_l: float
    ev_make: Optional[str] = None
    ev_model: Optional[str] = None
    ev_variant: Optional[str] = None
    ice_make: Optional[str] = None
    ice_model: Optional[str] = None
    ice_variant: Optional[str] = None

class CCVehicleEfficiencyRequest(BaseModel):
    make: str
    model: str
    variant: Optional[str] = None

@app.post("/costComparison/predict")
def costComparisonPredict(req: CCPredictRequest):
    return costComparison.costComparison.predict(req)

@app.post("/costComparison/charts")
def costComparisonCharts(req: CCPredictRequest):
    return costComparison.costComparison.charts(req)

@app.get("/costComparison/vehicles/ev")
def costComparisonEv_vehicles():
    return costComparison.costComparison.ev_vehicles()

@app.get("/costComparison/vehicles/ice")
def costComparisonIce_vehicles():
    return costComparison.costComparison.ice_vehicles()

@app.post("/costComparison/vehicles/ev/efficiency")
def costComparisonEv_efficiency(req: CCVehicleEfficiencyRequest):
    return costComparison.costComparison.ev_efficiency(req)

@app.post("/costComparison/vehicles/ice/efficiency")
def costComparisonIce_efficiency(req: CCVehicleEfficiencyRequest):
    return costComparison.costComparison.ice_efficiency(req)

# =============================================================
# Price Prediction Use Case
class PPSchemaResponse(BaseModel):
    feature_columns: List[str]
    numeric_columns: List[str]
    categorical_columns: List[str]
    feature_descriptions: Dict[str, str]
    schema_source: Optional[str]

class PPModelInfoResponse(BaseModel):
    model_type: str
    pipeline_steps: List[str]
    n_features_in: Optional[int]
    schema_source: Optional[str]

class PPPredictionRequest(BaseModel):
    row_id: Optional[Union[str, int]] = Field(default=None)
    features: Dict[str, Any] = Field(..., description="Raw feature inputs")
    auto_derive: bool = Field(
        default=True,
        description="Derive engineered features and fill enrichment defaults when missing",
    )

class PPPredictionResponse(BaseModel):
    row_id: Optional[Union[str, int]]
    predicted_log_price: float
    predicted_price: float
    missing_features: List[str]
    extra_features: List[str]
    derived_features: List[str] = Field(default_factory=list)

class PPPredictionRecord(BaseModel):
    row_id: Optional[Union[str, int]] = Field(default=None)
    features: Dict[str, Any] = Field(..., description="Raw feature inputs")
    auto_derive: bool = Field(default=True)

class PPBatchPredictionRequest(BaseModel):
    records: List[PPPredictionRecord]

class PPBatchPredictionResponse(BaseModel):
    predictions: List[PPPredictionResponse]
    count: int
    timestamp: datetime

class PPHealthResponse(BaseModel):
    status: str
    model_loaded: bool
    timestamp: datetime
    feature_count: int

@app.get("/pricePrediction/health", response_model=PPHealthResponse)
async def health() -> PPHealthResponse:
    return await pricePrediction.price_prediction_api.health()

@app.get("/pricePrediction/schema", response_model=PPSchemaResponse)
async def pricePredictionSchema() -> PPSchemaResponse:
    return await pricePrediction.price_prediction_api.schema()

@app.get("/pricePrediction/model/info", response_model=PPModelInfoResponse)
async def pricePredictionModel_info() -> PPModelInfoResponse:
    return await pricePrediction.price_prediction_api.model_info()

@app.post("/pricePrediction/predict", response_model=PPPredictionResponse)
async def pricePredictionPredict(request: PPPredictionRequest) -> PPPredictionResponse:
    print(request)
    return await pricePrediction.price_prediction_api.predict(request)

@app.post("/pricePrediction/predict/batch", response_model=PPBatchPredictionResponse)
async def pricePrediction_predict_batch(request: PPBatchPredictionRequest) -> PPBatchPredictionResponse:
    return await pricePrediction.price_prediction_api.predict_batch(request)

# =============================================================
# Charging Station Recommendation Use Case
@app.post("/charging-station-recommendations/rank", response_model=RankChargingStationsResponse,)
def stationRecommendation_rank_charging_stations(request: RankChargingStationsRequest) -> RankChargingStationsResponse:
    return charging_station_recommendation_api.main.rank_charging_stations(request)
