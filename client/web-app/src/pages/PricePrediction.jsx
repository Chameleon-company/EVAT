import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { getPriceHealth, predictPrice } from "../services/pricePredictionService";
import "../styles/Root.css";
import "../styles/Buttons.css";
import "../styles/Elements.css";
import "../styles/Fonts.css";
import "../styles/Forms.css";
import "../styles/NavBar.css";
import "../styles/Validation.css";
import "../styles/PricePrediction.css";

/** Dropdown values from the Price Prediction training dataset (artifacts). */
const BRAND_MODELS = {
  Audi: ["A3", "A4", "Q5", "Q7"],
  BMW: ["3 Series", "5 Series", "X3", "X5"],
  Ford: ["Explorer", "Fiesta", "Focus", "Mustang"],
  Honda: ["Accord", "CR-V", "Civic", "Fit"],
  Mercedes: ["C-Class", "E-Class", "GLA", "GLC"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["Camry", "Corolla", "Prius", "RAV4"],
};

const FUEL_TYPES = ["Diesel", "Electric", "Hybrid", "Petrol"];
const TRANSMISSIONS = ["Automatic", "Manual"];
const CONDITIONS = ["Like New", "New", "Used"];

const formatAud = (value) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function PricePrediction() {
  const [brand, setBrand] = useState("Tesla");
  const [model, setModel] = useState("Model 3");
  const [year, setYear] = useState(2022);
  const [mileage, setMileage] = useState(15000);
  const [engineSize, setEngineSize] = useState(0);
  const [fuelType, setFuelType] = useState("Electric");
  const [transmission, setTransmission] = useState("Automatic");
  const [condition, setCondition] = useState("Like New");

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState(null);

  const tokenFull = localStorage.getItem("currentUser");
  const token = tokenFull ? JSON.parse(tokenFull).token : null;

  useEffect(() => {
    getPriceHealth()
      .then(setHealth)
      .catch((err) => {
        // Detailed reason stays in the console; the banner must not claim a model failure
        // when the service was simply unreachable.
        console.warn("Price prediction health check failed:", err.message);
        setHealth({ status: "unavailable", unreachable: true });
      });
  }, []);

  useEffect(() => {
    const models = BRAND_MODELS[brand] || [];
    if (!models.includes(model)) setModel(models[0] || "");
  }, [brand, model]);

  useEffect(() => {
    if (fuelType === "Electric") {
      setEngineSize(0);
    } else if (!engineSize || Number(engineSize) <= 0) {
      setEngineSize(2.5);
    }
  }, [fuelType]);

  const brands = Object.keys(BRAND_MODELS);
  const models = BRAND_MODELS[brand] || [];

  const handlePredict = async (e) => {
    e.preventDefault();
    setServerError("");
    setResult(null);

    if (!token) {
      setServerError("Please sign in to run a prediction.");
      return;
    }

    if (fuelType !== "Electric" && (!engineSize || Number(engineSize) <= 0)) {
      setServerError("Engine Size must be greater than 0 for non-electric vehicles.");
      return;
    }

    setLoading(true);
    try {
      const features = {
        Brand: brand,
        Model: model,
        Year: Number(year),
        Mileage: Number(mileage),
        "Engine Size": fuelType === "Electric" ? 0 : Number(engineSize),
        "Fuel Type": fuelType,
        Transmission: transmission,
        Condition: condition,
      };
      const prediction = await predictPrice(features, token, "web-ui");
      setResult(prediction);
    } catch (err) {
      setServerError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-prediction-page">
      <NavBar />
      <div className="background-image" />

      <div className="pp-container">
        <div className="pp-header">
          <div className="pp-badge">USE CASE</div>
          <h1 className="pp-title">Vehicle Price Prediction</h1>
          <p className="pp-subtitle">
            Estimates purchase price via the Price Prediction model (`Log_Price` → `expm1`).
            Engineered features are auto-derived; enrichment signals use training-data defaults.
          </p>
          {health && (
            <p className={`pp-health ${health.model_loaded ? "pp-health--ok" : "pp-health--down"}`}>
              {health.unreachable
                ? "ML service unavailable"
                : `ML service: ${health.status}${
                    health.model_loaded
                      ? ` · model loaded (${health.feature_count} features)`
                      : " · model not loaded"
                  }`}
            </p>
          )}
        </div>

        <div className="pp-layout">
          <form className="pp-panel" onSubmit={handlePredict}>
            <div className="pp-fields">
              <div className="pp-field">
                <label className="pp-label">Brand</label>
                <select
                  className="input pp-input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="pp-field">
                <label className="pp-label">Model</label>
                <select
                  className="input pp-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="pp-field">
                <label className="pp-label">Year</label>
                <input
                  className="input pp-input"
                  type="number"
                  value={year}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div className="pp-field">
                <label className="pp-label">Mileage (km)</label>
                <input
                  className="input pp-input"
                  type="number"
                  value={mileage}
                  min={0}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>

              <div className="pp-field">
                <label className="pp-label">Fuel Type</label>
                <select
                  className="input pp-input"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="pp-field">
                <label className="pp-label">Transmission</label>
                <select
                  className="input pp-input"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                >
                  {TRANSMISSIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="pp-field">
                <label className="pp-label">Condition</label>
                <select
                  className="input pp-input"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pp-field">
                <label className="pp-label">Engine Size (L)</label>
                <input
                  className="input pp-input"
                  type="number"
                  step="0.1"
                  value={engineSize}
                  min={0}
                  disabled={fuelType === "Electric"}
                  onChange={(e) => setEngineSize(e.target.value)}
                />
              </div>
            </div>

            {serverError && <p className="pp-error">{serverError}</p>}

            <button type="submit" className="pp-submit" disabled={loading}>
              {loading ? "Predicting…" : "Predict Price"}
            </button>
          </form>

          <div className={`pp-panel pp-result-panel${result ? " has-result" : ""}`}>
            {!result && !loading && (
              <p className="pp-placeholder">
                Enter vehicle details and run a prediction to see the estimated price.
              </p>
            )}

            {loading && <p className="pp-loading">Running ML model…</p>}

            {result && (
              <>
                <div className="pp-label pp-result-label">Predicted Price</div>
                <div className="pp-price">{formatAud(result.predicted_price)}</div>

                <div className="pp-cards">
                  <div className="pp-card">
                    <div className="pp-label">Log Price</div>
                    <div className="pp-card-value">
                      {Number(result.predicted_log_price).toFixed(4)}
                    </div>
                  </div>

                  <div className="pp-card pp-card--info">
                    <div className="pp-label pp-label--info">Price calculation</div>
                    <div className="pp-calc">
                      <div>
                        Model predicts <code>Log_Price</code> ={" "}
                        <strong>{Number(result.predicted_log_price).toFixed(4)}</strong>
                      </div>
                      <div className="pp-calc-row">
                        <code>Price</code> = <code>expm1(Log_Price)</code> ={" "}
                        <code>e^{Number(result.predicted_log_price).toFixed(4)} − 1</code>
                      </div>
                      <div className="pp-calc-row">
                        ={" "}
                        <strong>
                          {formatAud(Math.max(0, Math.expm1(Number(result.predicted_log_price))))}
                        </strong>{" "}
                        (floored at 0)
                      </div>
                    </div>
                  </div>

                  {result.missing_features?.length > 0 ? (
                    <div className="pp-card pp-card--warn">
                      <div className="pp-label pp-label--warn">Missing features</div>
                      <div className="pp-meta">{result.missing_features.join(", ")}</div>
                    </div>
                  ) : null}

                  {result.extra_features?.length > 0 ? (
                    <div className="pp-card pp-card--muted">
                      <div className="pp-label">Extra features (ignored)</div>
                      <div className="pp-meta">{result.extra_features.join(", ")}</div>
                    </div>
                  ) : null}

                  {!result.missing_features?.length && (
                    <div className="pp-card pp-card--ok">
                      <div className="pp-label pp-label--accent">Features</div>
                      <div className="pp-meta">
                        All model features filled
                        {result.derived_features?.length
                          ? ` (${result.derived_features.length} auto-derived)`
                          : ""}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
