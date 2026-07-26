import warnings
warnings.filterwarnings("ignore")

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import r2_score
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

EV_KWH_PER_KM = 0.15
FEATURES = [
    "distance_km", "electricity_price_per_kwh", "ice_eff_l_per_100km",
    "petrol_price_per_l", "fuel_cost_per_km", "ev_cost_per_km",
    "distance_x_petrol", "distance_x_elec", "eff_ratio",
]

_model = None
_model_name = None
_trained_data = None


def load_and_train(data_path: str = "data/dummy_data.csv"):
    global _model, _model_name, _trained_data

    df = pd.read_csv(data_path)
    df["petrol_price_per_l"]        = df["petrol_price_per_l"].clip(0, 5.0)
    df["electricity_price_per_kwh"] = df["electricity_price_per_kwh"].clip(0, 2.0)
    df["distance_km"]               = df["distance_km"].clip(0, df["distance_km"].quantile(0.99))
    df["ice_eff_l_per_100km"]       = df["ice_eff_l_per_100km"].clip(lower=0)

    y = df["savings_ice_minus_ev"].copy()
    q_low, q_high = y.quantile([0.01, 0.99])
    y = y.clip(q_low, q_high)

    df["fuel_cost_per_km"]  = (df["ice_eff_l_per_100km"] / 100.0) * df["petrol_price_per_l"]
    df["ev_cost_per_km"]    = df["electricity_price_per_kwh"] * EV_KWH_PER_KM
    df["distance_x_petrol"] = df["distance_km"] * df["petrol_price_per_l"]
    df["distance_x_elec"]   = df["distance_km"] * df["electricity_price_per_kwh"]
    df["eff_ratio"]          = df["ice_eff_l_per_100km"] / (EV_KWH_PER_KM * 100)

    X = df[FEATURES]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    preprocess = ColumnTransformer(
        [("num", Pipeline([("scaler", StandardScaler())]), FEATURES)],
        remainder="drop",
    )

    candidates = {
        "GradientBoosting": Pipeline([
            ("pre", "passthrough"),
            ("reg", GradientBoostingRegressor(
                n_estimators=350, learning_rate=0.05,
                max_depth=3, subsample=0.9, random_state=42
            )),
        ]),
        "RandomForest": Pipeline([
            ("pre", "passthrough"),
            ("reg", RandomForestRegressor(
                n_estimators=400, min_samples_leaf=2,
                random_state=42, n_jobs=-1
            )),
        ]),
        "Ridge": Pipeline([
            ("pre", preprocess),
            ("reg", Ridge(alpha=1.0)),
        ]),
    }

    best, best_score, best_name = None, -999, ""
    for name, pipe in candidates.items():
        pipe.fit(X_train, y_train)
        score = r2_score(y_test, pipe.predict(X_test))
        print(f"[model_runner] {name}: R²={score:.4f}")
        if score > best_score:
            best, best_score, best_name = pipe, score, name

    _model = best
    _model_name = best_name
    _trained_data = (X_test, y_test)
    print(f"[model_runner] Selected: {best_name} (R²={best_score:.4f})")


def predict(
    distance_km: float,
    electricity_price_per_kwh: float,
    ice_eff_l_per_100km: float,
    petrol_price_per_l: float,
    ev_kwh_per_km: float = EV_KWH_PER_KM
) -> dict:
    global _model
    if _model is None:
        raise RuntimeError("Model not loaded.")

    row = pd.DataFrame([{
        "distance_km":                distance_km,
        "electricity_price_per_kwh":  electricity_price_per_kwh,
        "ice_eff_l_per_100km":        ice_eff_l_per_100km,
        "petrol_price_per_l":         petrol_price_per_l,
        "fuel_cost_per_km":           (ice_eff_l_per_100km / 100.0) * petrol_price_per_l,
        "ev_cost_per_km":             electricity_price_per_kwh * ev_kwh_per_km,
        "distance_x_petrol":          distance_km * petrol_price_per_l,
        "distance_x_elec":            distance_km * electricity_price_per_kwh,
        "eff_ratio":                  ice_eff_l_per_100km / (ev_kwh_per_km * 100),
    }], columns=FEATURES)

    predicted_savings = float(_model.predict(row)[0])
    ev_trip_cost  = distance_km * ev_kwh_per_km * electricity_price_per_kwh
    ice_trip_cost = (ice_eff_l_per_100km / 100.0) * distance_km * petrol_price_per_l
    ev_co2_kg     = distance_km * ev_kwh_per_km * 0.70
    ice_co2_kg    = (ice_eff_l_per_100km / 100.0) * distance_km * 2.31

    return {
        "predicted_savings": round(predicted_savings, 2),
        "ev_trip_cost":      round(ev_trip_cost, 2),
        "ice_trip_cost":     round(ice_trip_cost, 2),
        "ev_co2_kg":         round(ev_co2_kg, 2),
        "ice_co2_kg":        round(ice_co2_kg, 2),
        "co2_saved_kg":      round(ice_co2_kg - ev_co2_kg, 2),
        "currency":          "AUD",
        "model_version":     _model_name or "unknown",
    }


def get_model_name() -> str:
    return _model_name or "unknown"


def get_chart_data(
    distance_km: float,
    electricity_price_per_kwh: float,
    ice_eff_l_per_100km: float,
    petrol_price_per_l: float
) -> dict:
    global _model, _trained_data

    if _model is None:
        raise RuntimeError("Model not loaded.")

    # Chart 1: 10-Year Savings Forecast 
    forecast_10yr = []
    for offset in range(1, 11):
        petrol = petrol_price_per_l * (1 + 0.05) ** offset
        elec   = electricity_price_per_kwh * (1 + 0.02) ** offset
        row = pd.DataFrame([{
            "distance_km":                distance_km,
            "electricity_price_per_kwh":  elec,
            "ice_eff_l_per_100km":        ice_eff_l_per_100km,
            "petrol_price_per_l":         petrol,
            "fuel_cost_per_km":           (ice_eff_l_per_100km / 100.0) * petrol,
            "ev_cost_per_km":             elec * EV_KWH_PER_KM,
            "distance_x_petrol":          distance_km * petrol,
            "distance_x_elec":            distance_km * elec,
            "eff_ratio":                  ice_eff_l_per_100km / (EV_KWH_PER_KM * 100),
        }], columns=FEATURES)
        savings = float(_model.predict(row)[0])
        forecast_10yr.append({
            "year": 2025 + offset,
            "predicted_savings": round(savings, 2)
        })

    # Chart 2: Multi-Scenario Comparison
    scenarios = {
        "Low (2% petrol, 1% elec)":    (0.02, 0.01),
        "Med (5% petrol, 2% elec)":    (0.05, 0.02),
        "High (8% petrol, 3.5% elec)": (0.08, 0.035),
    }
    multi_scenario = []
    for year_offset in range(1, 11):
        point = {"year": 2025 + year_offset}
        for scenario_name, (pg, eg) in scenarios.items():
            petrol = petrol_price_per_l * (1 + pg) ** year_offset
            elec   = electricity_price_per_kwh * (1 + eg) ** year_offset
            row = pd.DataFrame([{
                "distance_km":                distance_km,
                "electricity_price_per_kwh":  elec,
                "ice_eff_l_per_100km":        ice_eff_l_per_100km,
                "petrol_price_per_l":         petrol,
                "fuel_cost_per_km":           (ice_eff_l_per_100km / 100.0) * petrol,
                "ev_cost_per_km":             elec * EV_KWH_PER_KM,
                "distance_x_petrol":          distance_km * petrol,
                "distance_x_elec":            distance_km * elec,
                "eff_ratio":                  ice_eff_l_per_100km / (EV_KWH_PER_KM * 100),
            }], columns=FEATURES)
            savings = float(_model.predict(row)[0])
            point[scenario_name] = round(savings, 2)
        multi_scenario.append(point)

    # ── Chart 3: Feature Importance
    feature_importance = []
    try:
        reg = _model.named_steps["reg"]
        if hasattr(reg, "feature_importances_"):
            importances = reg.feature_importances_
            for fname, imp in zip(FEATURES, importances):
                feature_importance.append({
                    "feature": fname.replace("_", " "),
                    "importance": round(float(imp), 4)
                })
            feature_importance.sort(key=lambda x: x["importance"], reverse=True)
    except Exception:
        pass

    #  Chart 4: Actual vs Predicted Parity 
    parity = []
    try:
        if _trained_data is not None:
            X_test, y_test = _trained_data
            y_pred = _model.predict(X_test)
            step = max(1, len(y_test) // 200)
            for actual, predicted in zip(
                y_test.values[::step],
                y_pred[::step]
            ):
                parity.append({
                    "actual": round(float(actual), 2),
                    "predicted": round(float(predicted), 2)
                })
    except Exception:
        pass

    return {
        "forecast_10yr":      forecast_10yr,
        "multi_scenario":     multi_scenario,
        "feature_importance": feature_importance,
        "parity":             parity,
        "scenario_keys":      list(scenarios.keys()),
    }

def get_ev_vehicles() -> dict:
    """Returns nested dict of EV makes -> models -> variants from CSV"""
    df = pd.read_csv("data/test.ev_vehicles.csv")
    df = df.drop_duplicates()

    make_col = next((c for c in df.columns if c.lower() in ["make", "brand", "manufacturer"]), None)
    model_col = next((c for c in df.columns if c.lower() in ["model", "name"]), None)
    variant_col = next((c for c in df.columns if c.lower() in ["variant", "trim"]), None)

    if not make_col or not model_col:
        return {}

    result = {}
    for make in sorted(df[make_col].dropna().unique()):
        result[make] = {}
        subset = df[df[make_col] == make]
        for model in sorted(subset[model_col].dropna().unique()):
            msubset = subset[subset[model_col] == model]
            variants = []
            if variant_col:
                variants = sorted(msubset[variant_col].dropna().astype(str).unique().tolist())
            result[make][model] = variants
    return result


def get_ice_vehicles() -> dict:
    """Returns nested dict of ICE makes -> models -> variants from CSV"""
    df = pd.read_csv("data/ice_vehicles.csv")
    df = df.drop_duplicates()

    result = {}
    for make in sorted(df["make"].dropna().unique()):
        result[make] = {}
        subset = df[df["make"] == make]
        for model in sorted(subset["model"].dropna().unique()):
            msubset = subset[subset["model"] == model]
            variants = sorted(msubset["variant"].dropna().astype(str).unique().tolist())
            result[make][model] = variants
    return result


def get_ev_efficiency(make: str, model: str, variant: str = None) -> float:
    """Looks up EV efficiency from CSV, returns kWh/km"""
    df = pd.read_csv("data/test.ev_vehicles.csv")
    df = df.drop_duplicates()

    make_col = next((c for c in df.columns if c.lower() in ["make", "brand", "manufacturer"]), None)
    model_col = next((c for c in df.columns if c.lower() in ["model", "name"]), None)
    variant_col = next((c for c in df.columns if c.lower() in ["variant", "trim"]), None)

    if not make_col or not model_col:
        return 0.15

    mask = (df[make_col].astype(str).str.lower() == make.lower()) & \
           (df[model_col].astype(str).str.lower() == model.lower())

    if variant and variant_col:
        mask &= df[variant_col].astype(str).str.lower() == variant.lower()

    subset = df[mask]
    if subset.empty:
        return 0.15

    row = subset.iloc[0]

    # Try direct efficiency columns
    for col in ["efficiency_kwh_per_km", "kwh_per_km", "efficiency_kwhkm", "ev_efficiency"]:
        if col in row and pd.notna(row[col]):
            try:
                val = float(row[col])
                if val > 0:
                    return val
            except Exception:
                pass

    # Try per 100km columns
    for col in ["efficiency_kwh_per_100km", "kwh_per_100km"]:
        if col in row and pd.notna(row[col]):
            try:
                val = float(row[col])
                if val > 0:
                    return val / 100.0
            except Exception:
                pass

    # Derive from battery and range
    batt_col = next((c for c in ["battery_kwh", "battery_capacity_kwh", "battery_capacity"] if c in row and pd.notna(row[c])), None)
    range_col = next((c for c in ["range_km", "wltp_range_km", "epa_range_km", "range"] if c in row and pd.notna(row[c])), None)

    if batt_col and range_col:
        try:
            batt = float(row[batt_col])
            rng = float(row[range_col])
            if batt > 0 and rng > 0:
                return batt / rng
        except Exception:
            pass

    return 0.15  # default fallback


def get_ice_efficiency(make: str, model: str, variant: str = None) -> float:
    """Looks up ICE fuel efficiency from CSV, returns L/100km"""
    df = pd.read_csv("data/ice_vehicles.csv")
    df = df.drop_duplicates()

    mask = df["make"].astype(str).str.lower() == make.lower()
    mask &= df["model"].astype(str).str.lower() == model.lower()

    if variant:
        mask &= df["variant"].astype(str).str.lower() == variant.lower()

    subset = df[mask]
    if subset.empty:
        return 7.0  # default fallback

    return float(subset.iloc[0]["l_per_100km"])