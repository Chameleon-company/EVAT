import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 " +
  "text-sm text-slate-700 outline-none transition-all duration-200 " +
  "hover:border-emerald-400 hover:bg-white focus:border-emerald-500 " +
  "focus:bg-white focus:ring-2 focus:ring-emerald-100 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "dark:border-emerald-900/60 dark:bg-[#050806] dark:text-white " +
  "dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30 " +
  "dark:focus:border-emerald-500 dark:focus:bg-[#08100c] " +
  "dark:focus:ring-emerald-500/20";

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}) {

  // Local state for EV dropdowns
  const [selectedEvMake, setSelectedEvMake] = useState("Select");
  const [selectedEvModel, setSelectedEvModel] = useState("Select");
  const [selectedEvVariant, setSelectedEvVariant] = useState("Select");
  const [selectedEvYear, setSelectedEvYear] = useState("Select");
  const [selectedEv, setSelectedEv] = useState("Select");

  // Local state for ICE dropdowns
  const [selectedIceMake, setSelectedIceMake] = useState("Select");
  const [selectedIceModel, setSelectedIceModel] = useState("Select");
  const [selectedIceVariant, setSelectedIceVariant] = useState("Select");
  const [selectedIceYear, setSelectedIceYear] = useState("Select");
  const [selectedIce, setSelectedIce] = useState("Select");

  // States for ICE data
  const [allIceVehicles, setAllIceVehicles] = useState([]);
  const [iceMakes, setIceMakes] = useState(["Select"]);
  const [loadingIce, setLoadingIce] = useState(false);
  const [iceError, setIceError] = useState(null);

  // State for comparison result
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [errorCompare, setErrorCompare] = useState(null);

  // Fetch ICE vehicles ONLY when this component mounts
  useEffect(() => {
    const fetchIceVehicles = async () => {
      if (!user || loadingIce) return;

      setLoadingIce(true);
      setIceError(null);

      try {
        const res = await fetch(`${API_URL}/ice-vehicle`, {   // ← adjust endpoint if needed
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch ICE vehicles");

        const data = await res.json();
        const items = (data.data || []).map((v) => ({
          ...v,
          id: v.id || v._id,
          year: v.year || v.model_release_year,
        }))
        .filter((v) => v.fuel_type && v.fuel_type !== "Pure Electric");  // Ensure we only keep ICE vehicles

        setAllIceVehicles(items);
        setIceMakes(["Select", ...new Set(items.map((v) => v.make))]);
      } catch (err) {
        console.error("Failed to load ICE vehicles:", err);
        setIceError(err.message);
      } finally {
        setLoadingIce(false);
      }
    };

    fetchIceVehicles();
  }, [user]);

  // Filter EV models, variants and years based on selection
  const filteredEvModels = allElectricVehicles
    .filter(v => v.make === selectedEvMake)
    .map(v => v.model);

  const filteredEvVariants = allElectricVehicles
    .filter(v => v.make === selectedEvMake && v.model === selectedEvModel)
    .map(v => v.variant);

  const filteredEvYears = allElectricVehicles
    .filter(v => v.make === selectedEvMake && v.model === selectedEvModel && v.variant === selectedEvVariant)
    .map(v => v.year || v.model_release_year)
    .filter(Boolean);

  // Save the selected EV object to access other data
  useEffect(() => {
    if (selectedEvMake === "Select" || selectedEvModel === "Select" || selectedEvYear === "Select") {
      setSelectedEv(null);
      return;
    }

    const found = allElectricVehicles.find(v =>
      v.make === selectedEvMake &&
      v.model === selectedEvModel &&
      v.variant === selectedEvVariant &&
      String(v.year || v.model_release_year) === String(selectedEvYear)
    );

    setSelectedEv(found || null);
  }, [selectedEvMake, selectedEvModel, selectedEvVariant, selectedEvYear, allElectricVehicles]);

  // Fetch comparison result whenever selected EV or ICE changes
  useEffect(() => {
  const fetchComparison = async () => {
    if (!selectedEv?.id || !selectedIce?.id) {
  setComparisonResult(null);
  setErrorCompare(null);
  return;
}

    try {
      setLoadingCompare(true);
      setErrorCompare(null);
      setComparisonResult(null);

  const res = await fetch(
    `${API_URL}/env-impact-analysis/compare`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", },
      body: JSON.stringify({
        evVehicleId: selectedEv.id,
        iceVehicleId: selectedIce.id,
      }),
    }
  );

      if (!res.ok) {
        throw new Error("Failed to fetch comparison");
      }

      const data = await res.json();
      console.log("COMPARE RESULT:", data);

      setComparisonResult(data.data);
    } catch (err) {
      console.error(err);
      setErrorCompare(err.message);
    } finally {
      setLoadingCompare(false);
    }
  };

  fetchComparison();
}, [selectedEv, selectedIce]);

  // Filter ICE models, variants and years based on selection
  const filteredIceModels = allIceVehicles
    .filter(v => v.make === selectedIceMake)
    .map(v => v.model);

  const filteredIceVariants = allIceVehicles
    .filter(v => v.make === selectedIceMake && v.model === selectedIceModel)
    .map(v => v.variant);

  const filteredIceYears = allIceVehicles
    .filter(v => v.make === selectedIceMake && v.model === selectedIceModel && v.variant === selectedIceVariant)
    .map(v => v.year || v.model_release_year)
    .filter(Boolean);

  // Save the selected ICE object to access other data
  useEffect(() => {
    if (selectedIceMake === "Select" || selectedIceModel === "Select" || selectedIceYear === "Select") {
      setSelectedIce(null);
      return;
    }

    const found = allIceVehicles.find(v =>
      v.make === selectedIceMake &&
      v.model === selectedIceModel &&
      v.variant === selectedIceVariant &&
      String(v.year || v.model_release_year) === String(selectedIceYear)
    );

    setSelectedIce(found || null);
  }, [selectedIceMake, selectedIceModel, selectedIceVariant, selectedIceYear, allIceVehicles]);

      const hasValue = (value) =>
        value !== null && value !== undefined && value !== "";

      const displayValue = (value) => {
        return hasValue(value) ? value : "N/A";
      };

  // Loading ICE data
  if (loadingIce) return <div className="horizontal center">Loading petrol/diesel vehicles...</div>;
  // Error while loading ICE data
  if (iceError) return <div className="horizontal center">Error loading ICE vehicles: {iceError}</div>;

  return (
    <div>
      <label
        className="
          mb-1.5
          block
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={selectClass}
      >
        <option value="Select">
          Select {label.toLowerCase()}
        </option>

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
    <div
      className="
        group
        grid
        grid-cols-3
        items-center
        border-t
        border-slate-100
        px-6
        py-4
        transition-all
        duration-200
        hover:bg-slate-50
        dark:border-white/10
        dark:hover:bg-emerald-950/20
      "
    >
      <div className="text-center">
        <span
          className="
            inline-flex
            min-w-16
            justify-center
            rounded-md
            px-3
            py-1
            font-semibold
            text-emerald-600
            transition
            group-hover:bg-emerald-50
            dark:text-emerald-400
            dark:group-hover:bg-emerald-950/40
          "
        >
          {ev ?? "—"}
        </span>
      </div>

      <div
        className="
          text-center
          text-sm
          font-semibold
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </div>

      <div className="text-center">
        <span
          className="
            inline-flex
            min-w-16
            justify-center
            rounded-md
            px-3
            py-1
            font-semibold
            text-blue-600
            transition
            group-hover:bg-blue-50
            dark:text-blue-400
            dark:group-hover:bg-blue-950/40
          "
        >
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
      className={`
        group
        rounded-2xl
        border
        bg-white
        p-6
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        dark:bg-[#050806]
        dark:shadow-[0_12px_35px_rgba(0,0,0,0.35)]
        dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]
        ${
          isEV
            ? `
              border-emerald-100
              hover:border-emerald-300
              hover:shadow-emerald-100
              dark:border-emerald-900/60
              dark:hover:border-emerald-700
              dark:hover:shadow-emerald-950/30
            `
            : `
              border-blue-100
              hover:border-blue-300
              hover:shadow-blue-100
              dark:border-blue-900/60
              dark:hover:border-blue-700
              dark:hover:shadow-blue-950/30
            `
        }
      `}
    >
      {/* Card heading */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div
            className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              isEV
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-blue-600 dark:text-blue-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isEV
                  ? "bg-emerald-500"
                  : "bg-blue-500"
              }`}
            />

            {isEV
              ? "Electric Vehicle"
              : "Petrol / Diesel"}
          </div>

          <h2
            className="
              text-xl
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            {isEV ? "EV" : "ICE"} Selection
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Choose a vehicle to compare.
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
            isEV
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
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
          onChange={(e) =>
            setYear(e.target.value)
          }
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
    (async () => {
      if (!user) return;

      fetch(`${API_URL}/ice-vehicle`, {
        headers: {
          credentials: "include",
        },
      })
        .then((res) => {
          if (!res.ok)
            throw new Error(
              "Failed to load ICE vehicles"
            );

          return res.json();
        })
        .then((data) => {
          setIceVehicles((data.data || []).map((v) => ({
            ...v,
            id: v.id || v._id,
            year: v.year || v.model_release_year,
          })).filter(
            (v) => v.fuel_type && v.fuel_type !== "Pure Electric"
          ));
        })
        .catch((err) =>
          setError(err.message)
        );
    })();
  }, [user]);

  const options = (
    vehicles,
    field,
    filters = {}
  ) => [
    ...new Set(
      vehicles
        .filter((v) =>
          Object.entries(filters).every(
            ([key, value]) =>
              v[key] === value
          )
        )
        .map((v) => v[field])
        .filter(Boolean)
    ),
  ];

  const evModels = useMemo(
    () =>
      options(
        allElectricVehicles,
        "model",
        { make: evMake }
      ),
    [allElectricVehicles, evMake]
  );

  const evVariants = useMemo(
    () =>
      options(
        allElectricVehicles,
        "variant",
        {
          make: evMake,
          model: evModel,
        }
      ),
    [allElectricVehicles, evMake, evModel]
  );

  const evYears = useMemo(
    () =>
      options(
        allElectricVehicles,
        "year",
        {
          make: evMake,
          model: evModel,
          variant: evVariant,
        }
      ).map(String),
    [
      allElectricVehicles,
      evMake,
      evModel,
      evVariant,
    ]
  );

  const iceMakes = useMemo(
    () =>
      options(
        iceVehicles,
        "make"
      ),
    [iceVehicles]
  );

  const iceModels = useMemo(
    () =>
      options(
        iceVehicles,
        "model",
        { make: iceMake }
      ),
    [iceVehicles, iceMake]
  );

  const iceVariants = useMemo(
    () =>
      options(
        iceVehicles,
        "variant",
        {
          make: iceMake,
          model: iceModel,
        }
      ),
    [iceVehicles, iceMake, iceModel]
  );

  const iceYears = useMemo(
    () =>
      options(
        iceVehicles,
        "year",
        {
          make: iceMake,
          model: iceModel,
          variant: iceVariant,
        }
      ).map(String),
    [
      iceVehicles,
      iceMake,
      iceModel,
      iceVariant,
    ]
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
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              evVehicleId: ev.id,
              iceVehicleId: ice.id,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch comparison"
          );
        }

        const data =
          await response.json();

        setResult(data.data);
      } catch (err) {
        setError(err.message);
      }
    };

    compare();
  }, [ev, ice, user]);

  return (
    <div
      className="
        mx-auto
        max-w-6xl
        px-4
        pb-12
      "
    >
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
      <section
        className="
          mt-8
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          transition-shadow
          duration-300
          hover:shadow-lg
          dark:border-emerald-900/50
          dark:bg-[#050806]
          dark:shadow-[0_12px_35px_rgba(0,0,0,0.35)]
          dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]
        "
      >
        <div
          className="
            border-b
            border-slate-200
            px-6
            py-5
            dark:border-white/10
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Environmental Comparison
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Compare the environmental
                performance of both vehicles.
              </p>
            </div>

            {result && (
              <span
                className="
                  hidden
                  rounded-full
                  bg-emerald-50
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-emerald-600
                  sm:block
                  dark:bg-emerald-950/50
                  dark:text-emerald-400
                "
              >
                Comparison complete
              </span>
            )}
          </div>
        </div>

        {/* Vehicle names */}
        <div className="grid grid-cols-2">
          <div
            className="
              border-r
              border-slate-100
              p-6
              transition-colors
              hover:bg-emerald-50/40
              dark:border-white/10
              dark:hover:bg-emerald-950/20
            "
          >
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-emerald-600
                dark:text-emerald-400
              "
            >
              Electric Vehicle
            </p>

            <h3
              className="
                mt-2
                text-lg
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              {ev
                ? `${ev.make} ${ev.model}`
                : "Select vehicle"}
            </h3>

            <p
              className="
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              {ev?.variant || "—"}
            </p>

            <p
              className="
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              {ev
                ? `${ev.fuel_type || "Electric"} · ${ev.year}`
                : "—"}
            </p>
          </div>

          <div
            className="
              p-6
              transition-colors
              hover:bg-blue-50/40
              dark:hover:bg-blue-950/20
            "
          >
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-blue-600
                dark:text-blue-400
              "
            >
              Petrol / Diesel Vehicle
            </p>

            <h3
              className="
                mt-2
                text-lg
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              {ice
                ? `${ice.make} ${ice.model}`
                : "Select vehicle"}
            </h3>

            <p
              className="
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              {ice?.variant || "—"}
            </p>

            <p
              className="
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              {ice
                ? `${ice.fuel_type || "Petrol / Diesel"} · ${ice.year}`
                : "—"}
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
        <div
          className="
            mt-5
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-5
            py-4
            text-center
            text-sm
            font-medium
            text-red-600
            dark:border-red-500/30
            dark:bg-red-950/30
            dark:text-red-400
          "
        >
          Unable to calculate environmental
          impact: {error}
        </div>
      )}

      {!error && ev && ice && !result && (
        <div
          className="
            mt-5
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-5
            py-4
            text-center
            text-sm
            text-slate-500
            dark:border-white/10
            dark:bg-white/[0.04]
            dark:text-slate-400
          "
        >
          Calculating environmental impact...
        </div>
      )}
    </div>
  );
}