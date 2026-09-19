import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import NavBar from "../components/NavBar";
import {
  getPriceHealth,
  predictPrice,
} from "../services/pricePredictionService";
import { BRAND_MODELS, FUEL_TYPES, TRANSMISSIONS, CONDITIONS, formatAud } from "../utils/priceOptions";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 " +
  "text-sm text-slate-700 outline-none transition-all duration-200 " +
  "hover:border-emerald-400 hover:bg-white focus:border-emerald-500 " +
  "focus:bg-white focus:ring-2 focus:ring-emerald-100 " +
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 " +
  "dark:border-emerald-900/60 dark:bg-[#08100c] dark:text-slate-100 " +
  "dark:hover:border-emerald-600 dark:hover:bg-[#0b1510] " +
  "dark:focus:border-emerald-500 dark:focus:bg-[#0b1510] " +
  "dark:focus:ring-emerald-900/50 dark:disabled:bg-[#050806] dark:disabled:text-slate-600";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export default function PricePrediction() {
  const { user } = useContext(UserContext);
  const [brand, setBrand] = useState("Tesla");
  const [model, setModel] = useState("Model 3");
  const [year, setYear] = useState(2022);
  const [mileage, setMileage] = useState(15000);
  const [engineSize, setEngineSize] = useState(0);
  const [fuelType, setFuelType] = useState("Electric");
  const [transmission, setTransmission] = useState("Automatic");
  const [condition, setCondition] = useState("Like New");

  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState(null);

  const brands = Object.keys(BRAND_MODELS);
  const models = BRAND_MODELS[brand] || [];

  // Numbers each health check. Checks can overlap (a slow first check and the re-check
  // after a prediction, say), so only the latest one may update the page.
  const healthRequestRef = useRef(0);

  /** Re-runnable so the page can recover when the service comes back. */
  const refreshHealth = useCallback(async () => {
    const requestId = ++healthRequestRef.current;
    const isLatest = () => requestId === healthRequestRef.current;
    setCheckingHealth(true);
    try {
      const next = await getPriceHealth();
      if (isLatest()) setHealth(next);
    } catch (err) {
      // Detailed reason stays in the console; the banner must not claim a model failure
      // when the service was simply unreachable.
      console.warn("Price prediction health check failed:", err.message);
      if (isLatest()) setHealth({ status: "unavailable", unreachable: true });
    } finally {
      // An older check finishing must not re-enable "Check again" while a newer one runs.
      if (isLatest()) setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    if (!models.includes(model)) {
      setModel(models[0] || "");
    }
  }, [brand, model]);

  useEffect(() => {
    if (fuelType === "Electric") {
      setEngineSize(0);
    } else if (!engineSize || Number(engineSize) <= 0) {
      setEngineSize(2.5);
    }
  }, [fuelType]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setServerError("");
    setResult(null);

    if (!user) {
      setServerError("Please sign in to run a prediction.");
      return;
    }

    if (
      fuelType !== "Electric" &&
      (!engineSize || Number(engineSize) <= 0)
    ) {
      setServerError(
        "Engine Size must be greater than 0 for non-electric vehicles."
      );
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
      const prediction = await predictPrice(features, "web-ui");
      setResult(prediction);
      // A successful prediction proves the service is up; keep the banner consistent
      // with what just happened instead of leaving a stale "unavailable" message.
      if (!health?.model_loaded) refreshHealth();
    } catch (err) {
      setServerError(err.message || "Prediction failed");
      // Keep the banner honest in the other direction too: if the service died while
      // this page was open, re-check rather than leaving a stale healthy message.
      refreshHealth();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black">
      <NavBar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            Vehicle Pricing
          </span>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Vehicle Price{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              Prediction
            </span>
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Estimate the purchase price of a vehicle using the EVAT price
            prediction model.
          </p>

          {health && (
            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-x-3 rounded-full px-3 py-1 text-xs font-semibold ${
                  health.unreachable || !health.model_loaded
                    ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                }`}
              >
                {health.unreachable
                  ? "ML service unavailable"
                  : health.model_loaded
                  ? `ML service ready · ${health.feature_count} features`
                  : "ML model not loaded"}
                  
                {health.model_loaded ? null : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="tiny"
                    onClick={refreshHealth}
                    loading={checkingHealth}
                    loadingLabel="Checking..."
                  >
                    Check again
                  </Button>
                )}
              </span>
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <form
            onSubmit={handlePredict}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-emerald-900/60 dark:bg-[#030504] dark:shadow-emerald-950/20 lg:col-span-3"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Vehicle Details
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter the vehicle information below.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Brand</label>

                <select
                  className={inputClass}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  {brands.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Model</label>

                <select
                  className={inputClass}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {models.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Year</label>

                <input
                  className={inputClass}
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Mileage (km)</label>

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Fuel Type</label>

                <select
                  className={inputClass}
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                >
                  {FUEL_TYPES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Transmission</label>

                <select
                  className={inputClass}
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                >
                  {TRANSMISSIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Condition</label>

                <select
                  className={inputClass}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  {CONDITIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Engine Size (L)</label>

                <input
                  className={inputClass}
                  type="number"
                  step="0.1"
                  min="0"
                  value={engineSize}
                  disabled={fuelType === "Electric"}
                  onChange={(e) => setEngineSize(e.target.value)}
                />
              </div>
            </div>

            {serverError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Predicting..." : "Predict Vehicle Price →"}
            </button>
          </form>

          <section
            className={`rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 dark:bg-[#030504] ${
              result
                ? "border-emerald-200 shadow-emerald-100 dark:border-emerald-900/60 dark:shadow-emerald-950/20"
                : "border-slate-200 dark:border-emerald-900/60"
            } lg:col-span-2`}
          >
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Prediction Result
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                Estimated Vehicle Price
              </h2>
            </div>

            {!result && !loading && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-slate-50 px-6 text-center dark:bg-[#08100c]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl dark:bg-emerald-950/50">
                  $
                </div>

                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Enter your vehicle details and run a prediction to see the
                  estimated price.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-64 items-center justify-center rounded-xl bg-slate-50 dark:bg-[#08100c]">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500 dark:border-emerald-950 dark:border-t-emerald-400" />

                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Running ML prediction...
                  </p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 p-6 text-center dark:bg-emerald-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Predicted Price
                  </p>

                  <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formatAud(result.predicted_price)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-emerald-900/60 dark:bg-[#08100c]">
                  <p className={labelClass}>Log Price</p>

                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {Number(result.predicted_log_price).toFixed(4)}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Price Calculation
                  </p>

                  <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      Model predicts{" "}
                      <code className="rounded bg-white px-1.5 py-0.5 text-xs dark:bg-slate-900 dark:text-slate-200">
                        Log_Price
                      </code>{" "}
                      ={" "}
                      <strong className="text-slate-900 dark:text-white">
                        {Number(result.predicted_log_price).toFixed(4)}
                      </strong>
                    </p>

                    <p>Price = expm1(Log_Price)</p>

                    <p className="font-semibold text-slate-900 dark:text-white">
                      ={" "}
                      {formatAud(
                        Math.max(
                          0,
                          Math.expm1(Number(result.predicted_log_price))
                        )
                      )}
                    </p>
                  </div>
                </div>

                {result.missing_features?.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Missing Features
                    </p>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {result.missing_features.join(", ")}
                    </p>
                  </div>
                )}

                {result.extra_features?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-emerald-900/60 dark:bg-[#08100c]">
                    <p className={labelClass}>Extra Features</p>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {result.extra_features.join(", ")}
                    </p>
                  </div>
                )}

                {!result.missing_features?.length && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Features Ready
                    </p>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      All model features filled
                      {result.derived_features?.length
                        ? ` · ${result.derived_features.length} auto-derived`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}