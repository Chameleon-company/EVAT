import React, { useState } from "react";

const WeatherAwareResult = ({ result }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!result) return null;

  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined || value === "") return "N/A";

    const number = Number(value);
    return Number.isNaN(number) ? "N/A" : number.toFixed(decimals);
  };

  const cleanInstruction = (instruction) => {
    if (!instruction) return "N/A";

    return instruction
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "N/A";

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }

    return `${Math.round(minutes)} min`;
  };

  const weather = result.weather || {};
  const chargingStops = result.charging_stops || [];
  const steps = result.steps || [];

  const weatherText =
    weather.temp_c !== undefined
      ? `${formatNumber(weather.temp_c)}°C`
      : "N/A";

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-emerald-900/60 dark:bg-[#050806] dark:shadow-emerald-950/20 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm dark:bg-emerald-400" />

            <span className="text-xs font-bold tracking-wide text-emerald-700 dark:text-emerald-400 sm:text-sm">
              ROUTE CALCULATED
            </span>
          </div>

          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            {result.charging_required
              ? `${chargingStops.length} charging stop${
                  chargingStops.length !== 1 ? "s" : ""
                }`
              : "No charging stop"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryItem
            icon="〽️"
            label="Distance"
            value={`${formatNumber(result.distance_km)} km`}
          />

          <SummaryItem
            icon="🕒"
            label="Duration"
            value={formatDuration(result.duration_in_traffic_min)}
          />

          <SummaryItem
            icon="🚧"
            label="Traffic"
            value={result.traffic_condition || "N/A"}
          />

          <SummaryItem
            icon="⚡"
            label={result.ac_on ? "Energy (AC On)" : "Energy"}
            value={`${formatNumber(result.energy_with_ac_kwh, 2)} kWh`}
          />

          <SummaryItem
            icon="🔋"
            label="SOC Needed"
            value={`${formatNumber(result.soc_needed_pct)}%`}
          />

          <SummaryItem
            icon="☁️"
            label="Weather"
            value={weatherText}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 dark:focus:ring-offset-[#050806]"
        >
          See Full Detail
          <span className="text-lg leading-none">→</span>
        </button>
      </div>

      {showDetails && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm dark:bg-black/80 sm:p-6"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-slate-50 shadow-2xl dark:border dark:border-emerald-900/60 dark:bg-[#030504]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-500 px-5 py-6 text-white sm:px-8 sm:py-7">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 text-xl text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close details"
              >
                ×
              </button>

              <p className="mb-2 text-xs font-black tracking-[0.18em] text-emerald-100">
                ⚡ TRIP PLAN
              </p>

              <h2 className="pr-10 text-xl font-extrabold sm:text-2xl">
                {result.origin_resolved || "Origin"} →{" "}
                {result.destination_resolved || "Destination"}
              </h2>

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold sm:gap-5">
                <span>〽️ {formatNumber(result.distance_km)} km</span>

                <span>
                  🕒 {formatDuration(result.duration_in_traffic_min)}
                </span>

                <span>
                  🔌{" "}
                  {result.charging_required
                    ? `${chargingStops.length} stop${
                        chargingStops.length !== 1 ? "s" : ""
                      }`
                    : "No stop"}
                </span>

                <span>
                  ⚡ {formatNumber(result.energy_with_ac_kwh, 2)} kWh
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <SectionTitle title="Energy Breakdown" />

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-emerald-900/60 dark:bg-[#050806]">
                    <DetailRow
                      label="Base consumption"
                      value={`${formatNumber(
                        result.energy_nominal_kwh,
                        2
                      )} kWh`}
                    />

                    <DetailRow
                      label="AC energy usage"
                      value={`${formatNumber(
                        result.energy_with_ac_kwh -
                          result.energy_nominal_kwh,
                        2
                      )} kWh`}
                    />

                    <DetailRow
                      label="SOC needed"
                      value={`${formatNumber(result.soc_needed_pct)}%`}
                    />

                    <DetailRow
                      label="SOC with contingency"
                      value={`${formatNumber(
                        result.soc_with_contingency_pct
                      )}%`}
                    />

                    <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <span>Total energy</span>

                      <strong>
                        {formatNumber(result.energy_with_ac_kwh, 2)} kWh
                      </strong>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionTitle title="Weather Conditions" />

                  <div className="mb-7 grid grid-cols-2 gap-3">
                    <MiniDetailCard
                      icon="🌡️"
                      label="Temperature"
                      value={`${formatNumber(weather.temp_c)}°C`}
                    />

                    <MiniDetailCard
                      icon="💨"
                      label="Wind"
                      value={`${formatNumber(
                        weather.wind_speed_ms,
                        2
                      )} m/s`}
                    />

                    <MiniDetailCard
                      icon="🧭"
                      label="Wind Direction"
                      value={`${formatNumber(weather.wind_deg, 0)}°`}
                    />

                    <MiniDetailCard
                      icon="🚧"
                      label="Traffic"
                      value={result.traffic_condition || "N/A"}
                    />
                  </div>

                  <SectionTitle title="Charging Stop" />

                  {result.charging_required && chargingStops.length > 0 ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <strong className="text-base">
                        {chargingStops[0].name}
                      </strong>

                      <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                        {chargingStops[0].address}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-[#08100c] dark:text-emerald-300">
                          ⭐ {chargingStops[0].rating || "N/A"}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-[#08100c] dark:text-emerald-300">
                          {chargingStops[0].open_now
                            ? "Open now"
                            : "Status N/A"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      No charging stop is required for this route.
                    </div>
                  )}
                </div>
              </div>

              {steps.length > 0 && (
                <div className="mt-8">
                  <SectionTitle title="Route Instructions" />

                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-[#050806]"
                      >
                        <div className="flex gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {cleanInstruction(
                              typeof step === "string"
                                ? step
                                : step.instruction ||
                                  step.html_instructions
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SummaryItem = ({ icon, label, value }) => {
  return (
    <div className="min-h-[82px] rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-[#08100c] dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30">
      <div className="mb-1.5 text-sm">{icon}</div>

      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-base font-bold capitalize text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
};

const SectionTitle = ({ title }) => {
  return (
    <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {title}
    </h3>
  );
};

const DetailRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-0 dark:border-emerald-950/60">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>

      <strong className="text-right text-slate-800 dark:text-slate-200">
        {value}
      </strong>
    </div>
  );
};

const MiniDetailCard = ({ icon, label, value }) => {
  return (
    <div className="min-h-[90px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 dark:border-emerald-900/60 dark:bg-[#050806] dark:hover:border-emerald-700">
      <div className="mb-2 text-sm">{icon}</div>

      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-base font-bold text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
};

export default WeatherAwareResult;