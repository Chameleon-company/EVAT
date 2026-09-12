import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 " +
  "text-sm text-slate-700 outline-none transition-all duration-200 " +
  "hover:border-emerald-400 hover:bg-white focus:border-emerald-500 " +
  "focus:bg-white focus:ring-2 focus:ring-emerald-100 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

function SelectField({ label, value, options, onChange, disabled }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={selectClass}
      >
        <option value="Select">Select {label.toLowerCase()}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricRow({ label, ev, ice }) {
  return (
    <div className="group grid grid-cols-3 items-center border-t border-slate-100 px-6 py-4 transition-all duration-200 hover:bg-slate-50">
      <div className="text-center">
        <span className="inline-flex min-w-16 justify-center rounded-md px-3 py-1 font-semibold text-emerald-600 transition group-hover:bg-emerald-50">
          {ev ?? "—"}
        </span>
      </div>

      <div className="text-center text-sm font-semibold text-slate-500">
        {label}
      </div>

      <div className="text-center">
        <span className="inline-flex min-w-16 justify-center rounded-md px-3 py-1 font-semibold text-blue-600 transition group-hover:bg-blue-50">
          {ice ?? "—"}
        </span>
      </div>
    </div>
  );
}

function VehicleCard({
  type,
  make,
  model,
  variant,
  year,
  makes,
  models,
  variants,
  years,
  setMake,
  setModel,
  setVariant,
  setYear,
}) {
  const isEV = type === "EV";

  return (
    <div
      className={`group rounded-2xl border bg-white p-6 shadow-sm
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        ${
          isEV
            ? "border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100"
            : "border-blue-100 hover:border-blue-300 hover:shadow-blue-100"
        }`}
    >
      {/* Card heading */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div
            className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              isEV ? "text-emerald-600" : "text-blue-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isEV ? "bg-emerald-500" : "bg-blue-500"
              }`}
            />

            {isEV ? "Electric Vehicle" : "Petrol / Diesel"}
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {isEV ? "EV" : "ICE"} Selection
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose a vehicle to compare.
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
            isEV
              ? "bg-emerald-50 text-emerald-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {isEV ? "⚡" : "🚗"}
        </div>
      </div>

      {/* Selects */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Make"
          value={make}
          options={makes}
          onChange={(e) => {
            setMake(e.target.value);
            setModel("Select");
            setVariant("Select");
            setYear("Select");
          }}
        />

        <SelectField
          label="Model"
          value={model}
          options={models}
          disabled={make === "Select"}
          onChange={(e) => {
            setModel(e.target.value);
            setVariant("Select");
            setYear("Select");
          }}
        />

        <SelectField
          label="Variant"
          value={variant}
          options={variants}
          disabled={model === "Select"}
          onChange={(e) => {
            setVariant(e.target.value);
            setYear("Select");
          }}
        />

        <SelectField
          label="Year"
          value={year}
          options={years}
          disabled={variant === "Select"}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>
    </div>
  );
}

export default function EnvironmentalImpact({
  user,
  allElectricVehicles = [],
  makes = [],
}) {
  const [iceVehicles, setIceVehicles] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [evMake, setEvMake] = useState("Select");
  const [evModel, setEvModel] = useState("Select");
  const [evVariant, setEvVariant] = useState("Select");
  const [evYear, setEvYear] = useState("Select");

  const [iceMake, setIceMake] = useState("Select");
  const [iceModel, setIceModel] = useState("Select");
  const [iceVariant, setIceVariant] = useState("Select");
  const [iceYear, setIceYear] = useState("Select");

  useEffect(() => {
    if (!user?.token) return;

    fetch(`${API_URL}/ice-vehicle`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load ICE vehicles");
        return res.json();
      })
      .then((data) => setIceVehicles(data.data || []))
      .catch((err) => setError(err.message));
  }, [user?.token]);

  const options = (vehicles, field, filters = {}) =>
    [...new Set(
      vehicles
        .filter((v) =>
          Object.entries(filters).every(
            ([key, value]) => v[key] === value
          )
        )
        .map((v) => v[field])
        .filter(Boolean)
    )];

  const evModels = useMemo(
    () => options(allElectricVehicles, "model", { make: evMake }),
    [allElectricVehicles, evMake]
  );

  const evVariants = useMemo(
    () =>
      options(allElectricVehicles, "variant", {
        make: evMake,
        model: evModel,
      }),
    [allElectricVehicles, evMake, evModel]
  );

  const evYears = useMemo(
    () =>
      options(allElectricVehicles, "year", {
        make: evMake,
        model: evModel,
        variant: evVariant,
      }).map(String),
    [allElectricVehicles, evMake, evModel, evVariant]
  );

  const iceMakes = useMemo(
    () => options(iceVehicles, "make"),
    [iceVehicles]
  );

  const iceModels = useMemo(
    () => options(iceVehicles, "model", { make: iceMake }),
    [iceVehicles, iceMake]
  );

  const iceVariants = useMemo(
    () =>
      options(iceVehicles, "variant", {
        make: iceMake,
        model: iceModel,
      }),
    [iceVehicles, iceMake, iceModel]
  );

  const iceYears = useMemo(
    () =>
      options(iceVehicles, "year", {
        make: iceMake,
        model: iceModel,
        variant: iceVariant,
      }).map(String),
    [iceVehicles, iceMake, iceModel, iceVariant]
  );

  const ev = allElectricVehicles.find(
    (v) =>
      v.make === evMake &&
      v.model === evModel &&
      v.variant === evVariant &&
      String(v.year) === String(evYear)
  );

  const ice = iceVehicles.find(
    (v) =>
      v.make === iceMake &&
      v.model === iceModel &&
      v.variant === iceVariant &&
      String(v.year) === String(iceYear)
  );

  useEffect(() => {
    if (!ev?.id || !ice?.id) {
      setResult(null);
      return;
    }

    const compare = async () => {
      try {
        setError("");

        const response = await fetch(
          `${API_URL}/env-impact-analysis/compare`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              evVehicleId: ev.id,
              iceVehicleId: ice.id,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch comparison");
        }

        const data = await response.json();
        setResult(data.data);
      } catch (err) {
        setError(err.message);
      }
    };

    compare();
  }, [ev, ice, user?.token]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">

      {/* Vehicle selection */}
      <div className="grid gap-6 lg:grid-cols-2">

        <VehicleCard
          type="EV"
          make={evMake}
          model={evModel}
          variant={evVariant}
          year={evYear}
          makes={makes}
          models={evModels}
          variants={evVariants}
          years={evYears}
          setMake={setEvMake}
          setModel={setEvModel}
          setVariant={setEvVariant}
          setYear={setEvYear}
        />

        <VehicleCard
          type="ICE"
          make={iceMake}
          model={iceModel}
          variant={iceVariant}
          year={iceYear}
          makes={iceMakes}
          models={iceModels}
          variants={iceVariants}
          years={iceYears}
          setMake={setIceMake}
          setModel={setIceModel}
          setVariant={setIceVariant}
          setYear={setIceYear}
        />

      </div>

      {/* Comparison */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Environmental Comparison
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Compare the environmental performance of both vehicles.
              </p>
            </div>

            {result && (
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 sm:block">
                Comparison complete
              </span>
            )}
          </div>
        </div>

        {/* Vehicle names */}
        <div className="grid grid-cols-2">

          <div className="border-r border-slate-100 p-6 transition-colors hover:bg-emerald-50/40">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
              Electric Vehicle
            </p>

            <h3 className="mt-2 text-lg font-bold text-slate-900">
              {ev ? `${ev.make} ${ev.model}` : "Select vehicle"}
            </h3>

            <p className="text-sm text-slate-500">
              {ev?.variant || "—"}
            </p>

            <p className="text-sm text-slate-500">
              {ev ? `${ev.fuel_type || "Electric"} · ${ev.year}` : "—"}
            </p>
          </div>

          <div className="p-6 transition-colors hover:bg-blue-50/40">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Petrol / Diesel Vehicle
            </p>

            <h3 className="mt-2 text-lg font-bold text-slate-900">
              {ice ? `${ice.make} ${ice.model}` : "Select vehicle"}
            </h3>

            <p className="text-sm text-slate-500">
              {ice?.variant || "—"}
            </p>

            <p className="text-sm text-slate-500">
              {ice ? `${ice.fuel_type || "Petrol / Diesel"} · ${ice.year}` : "—"}
            </p>
          </div>

        </div>

        {/* Metrics */}
        <MetricRow
          label="CO₂ Emissions"
          ev={ev?.co2_emissions_combined}
          ice={ice?.co2_emissions_combined}
        />

        <MetricRow
          label="Fuel Consumption"
          ev={ev?.fuel_consumption_combined}
          ice={ice?.fuel_consumption_combined}
        />

        <MetricRow
          label="Fuel Life Cycle CO₂"
          ev={ev?.fuel_life_cycle_co2}
          ice={ice?.fuel_life_cycle_co2}
        />

        <MetricRow
          label="Annual Tailpipe CO₂"
          ev={ev?.annual_tailpipe_co2}
          ice={ice?.annual_tailpipe_co2}
        />
      </section>

      {/* Error / status */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-600">
          Unable to calculate environmental impact: {error}
        </div>
      )}

      {!error && ev && ice && !result && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-sm text-slate-500">
          Calculating environmental impact...
        </div>
      )}

    </div>
  );
}