from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import Optional
import model_runner


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[startup] Training model...")
    model_runner.load_and_train("data/dummy_data.csv")
    print("[startup] Model ready.")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.post("/predict")
def predict(req: PredictRequest):
    try:
        # Get EV efficiency from CSV if vehicle selected
        if req.ev_make and req.ev_model:
            ev_eff = model_runner.get_ev_efficiency(req.ev_make, req.ev_model, req.ev_variant)
        else:
            ev_eff = 0.15

        # Get ICE efficiency from CSV if vehicle selected
        if req.ice_make and req.ice_model:
            ice_eff = model_runner.get_ice_efficiency(req.ice_make, req.ice_model, req.ice_variant)
        else:
            ice_eff = 7.0

        result = model_runner.predict(
            distance_km=req.distance_km,
            electricity_price_per_kwh=req.electricity_price_per_kwh,
            ice_eff_l_per_100km=ice_eff,
            petrol_price_per_l=req.petrol_price_per_l,
            ev_kwh_per_km=ev_eff,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/charts")
def charts(req: PredictRequest):
    try:
        # Get ICE efficiency from CSV if vehicle selected
        if req.ice_make and req.ice_model:
            ice_eff = model_runner.get_ice_efficiency(req.ice_make, req.ice_model, req.ice_variant)
        else:
            ice_eff = 7.0

        # Get EV efficiency from CSV if vehicle selected
        if req.ev_make and req.ev_model:
            ev_eff = model_runner.get_ev_efficiency(req.ev_make, req.ev_model, req.ev_variant)
        else:
            ev_eff = 0.15

        result = model_runner.get_chart_data(
            distance_km=req.distance_km,
            electricity_price_per_kwh=req.electricity_price_per_kwh,
            ice_eff_l_per_100km=ice_eff,
            petrol_price_per_l=req.petrol_price_per_l,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/vehicles/ev")
def ev_vehicles():
    try:
        return model_runner.get_ev_vehicles()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vehicles/ice")
def ice_vehicles():
    try:
        return model_runner.get_ice_vehicles()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class VehicleEfficiencyRequest(BaseModel):
    make: str
    model: str
    variant: Optional[str] = None

@app.post("/vehicles/ev/efficiency")
def ev_efficiency(req: VehicleEfficiencyRequest):
    try:
        eff = model_runner.get_ev_efficiency(req.make, req.model, req.variant)
        return {"efficiency_kwh_per_km": eff}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/vehicles/ice/efficiency")
def ice_efficiency(req: VehicleEfficiencyRequest):
    try:
        eff = model_runner.get_ice_efficiency(req.make, req.model, req.variant)
        return {"l_per_100km": eff}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/health")
def health():
    return {"status": "ok", "model": model_runner.get_model_name()}
