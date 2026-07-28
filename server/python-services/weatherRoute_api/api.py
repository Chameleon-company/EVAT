import pandas as pd
from shapely import wkt
from shapely.geometry import Point
import geopandas as gpd
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load("ev_model.pkl")

FEATURES = [
    "Year",
    "SHAPE_Length",
    "dist_to_nearest_ev_m",
    "ev_within_500m",
    "avg_temp",
    "total_prcp",
]

METRIC_EPSG = 32755

traffic_df = pd.read_csv("Traffic data.csv")
traffic_df["geometry"] = traffic_df["geometry"].apply(wkt.loads)

traffic_gdf = gpd.GeoDataFrame(
    traffic_df,
    geometry="geometry",
    crs="EPSG:4326"
).to_crs(epsg=METRIC_EPSG)

ev_df = pd.read_csv("EV stations data.csv")
ev_df = ev_df.dropna(subset=["Latitude", "Longitude"])

ev_gdf = gpd.GeoDataFrame(
    ev_df,
    geometry=gpd.points_from_xy(ev_df["Longitude"], ev_df["Latitude"]),
    crs="EPSG:4326"
).to_crs(epsg=METRIC_EPSG)

ev_coords = ev_df[["InfrastructureID", "Latitude", "Longitude"]]

weather_df = pd.read_csv("weather_by_station_2023.csv")
weather_df = weather_df.merge(ev_coords, on="InfrastructureID", how="left")

weather_station_features = (
    weather_df
    .groupby(["InfrastructureID", "Latitude", "Longitude"])[["TAVG", "PRCP"]]
    .agg(
        avg_temp=("TAVG", "mean"),
        total_prcp=("PRCP", "sum")
    )
    .reset_index()
)

weather_gdf = gpd.GeoDataFrame(
    weather_station_features,
    geometry=gpd.points_from_xy(
        weather_station_features["Longitude"],
        weather_station_features["Latitude"]
    ),
    crs="EPSG:4326"
).to_crs(epsg=METRIC_EPSG)

def _point_in_metric_crs(lat: float, lon: float, target_crs) -> Point:
    return gpd.GeoSeries(
        [Point(lon, lat)],
        crs="EPSG:4326"
    ).to_crs(target_crs).iloc[0]

def get_shape_length_from_coords(lat: float, lon: float) -> float:
    pt = _point_in_metric_crs(lat, lon, traffic_gdf.crs)
    distances = traffic_gdf.distance(pt)
    nearest_idx = distances.idxmin()
    shape_length = traffic_gdf.loc[nearest_idx, "SHAPE_Length"]
    return float(shape_length)

def get_ev_features_from_coords(lat: float, lon: float) -> tuple[float, int]:
    pt = _point_in_metric_crs(lat, lon, ev_gdf.crs)
    distances = ev_gdf.distance(pt)
    dist_to_nearest_ev_m = float(distances.min())
    ev_within_500m = int((distances <= 500).sum())
    return dist_to_nearest_ev_m, ev_within_500m

def get_weather_features_from_coords(lat: float, lon: float) -> tuple[float, float]:
    pt = _point_in_metric_crs(lat, lon, weather_gdf.crs)
    distances = weather_gdf.distance(pt)
    nearest_idx = distances.idxmin()
    avg_temp = float(weather_gdf.loc[nearest_idx, "avg_temp"])
    total_prcp = float(weather_gdf.loc[nearest_idx, "total_prcp"])
    return avg_temp, total_prcp

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    year: int
    start_lat: float
    start_lon: float

@app.get("/")
def root():
    return {"message": "EV model API is running"}

@app.post("/predict")
def predict(data: PredictRequest):
    try:
        year = data.year
        start_lat = data.start_lat
        start_lon = data.start_lon

        shape_length = get_shape_length_from_coords(start_lat, start_lon)
        dist_to_nearest_ev_m, ev_within_500m = get_ev_features_from_coords(start_lat, start_lon)
        avg_temp, total_prcp = get_weather_features_from_coords(start_lat, start_lon)

        feature_data = pd.DataFrame([[year, shape_length,
                                     dist_to_nearest_ev_m,
                                     ev_within_500m,
                                     avg_temp,
                                     total_prcp]], columns=FEATURES)

        pred = model.predict(feature_data)[0]

        return {
            "prediction": float(pred),
            "year": year,
            "start_lat": start_lat,
            "start_lon": start_lon,
            "dist_to_nearest_ev_m": dist_to_nearest_ev_m,
            "ev_within_500m": ev_within_500m,
            "avg_temp": avg_temp,
            "total_prcp": total_prcp,
            "used_SHAPE_Length": shape_length
        }

    except ValueError as e:
        return {"error": f"Invalid input: {str(e)}"}, 400
    except Exception as e:
        return {"error": str(e)}, 500
