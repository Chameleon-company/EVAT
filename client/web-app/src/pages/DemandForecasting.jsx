import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import NavBar from "../components/NavBar";
import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL;

const HOLIDAYS = [
  "2026-01-01",
  "2026-01-26",
  "2026-04-03",
  "2026-04-04",
  "2026-04-05",
  "2026-04-06",
  "2026-04-25",
  "2026-06-08",
  "2026-12-25",
  "2026-12-26",
  "2026-12-28",
];

const COLORS = ["#00b482", "#60a5fa", "#f472b6"];
const DAYS = [3, 7, 14, 16];

const formatDate = (date) => date.toISOString().split("T")[0];

const displayDate = (date) =>
  new Date(date).toLocaleDateString("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

const isHoliday = (date) => HOLIDAYS.includes(date);

const getDates = (count, offset = 0) =>
  Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1 + offset);
    return formatDate(date);
  });

const getLevel = (value, min, max) => {
  const range = max - min || 1;
  const ratio = (value - min) / range;

  if (ratio < 0.33)
    return {
      label: "Low",
      color: "#34d399",
      bg: "rgba(52,211,153,.15)",
    };

  if (ratio < 0.66)
    return {
      label: "Medium",
      color: "#fbbf24",
      bg: "rgba(251,191,36,.15)",
    };

  return {
    label: "High",
    color: "#f87171",
    bg: "rgba(248,113,113,.15)",
  };
};

const getHeatColor = (value, min, max) => {
  const range = max - min || 1;
  const t = (value - min) / range;

  return `rgb(
    ${Math.round(10 + t * 220)},
    ${Math.round(180 - t * 150)},
    ${Math.round(80 - t * 60)}
  )`;
};

const getMarkerColor = (value, min, max) => {
  const range = max - min || 1;
  const ratio = (value - min) / range;

  if (ratio < 0.33) return "#34d399";
  if (ratio < 0.66) return "#fbbf24";
  return "#f87171";
};

const PulseDot = ({ color = "#00b482" }) => (
  <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
    <span
      className="absolute h-2.5 w-2.5 animate-ping rounded-full opacity-40"
      style={{ backgroundColor: color }}
    />
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  </span>
);

const Card = ({ children, className = "" }) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
      transition-all duration-300
      hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg
      dark:border-emerald-900/50 dark:bg-[#050806]
      dark:shadow-[0_15px_40px_rgba(0,0,0,0.35)]
      dark:hover:border-emerald-700/70
      ${className}`}
  >
    {children}
  </section>
);

const Bar = ({ value, color = "#10b981" }) => (
  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{
        width: `${Math.min(value, 100)}%`,
        backgroundColor: color,
      }}
    />
  </div>
);

const TooltipContent = ({ active, payload, label, min, max }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-3 shadow-xl">
      <p className="mb-2 text-xs font-bold text-emerald-400">{label}</p>

      {payload.map((item, index) => {
        const level = getLevel(item.value, min, max);

        return (
          <div key={index} className="mb-2">
            <p className="text-sm font-semibold text-white">
              {item.value?.toFixed(2)}{" "}
              <span className="text-xs text-slate-500">kWh</span>
            </p>

            <span
              className="rounded-md border px-2 py-0.5 text-[10px] font-semibold"
              style={{
                color: level.color,
                backgroundColor: level.bg,
                borderColor: `${level.color}55`,
              }}
            >
              {level.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function DemandForecasting() {
  const [postcodes, setPostcodes] = useState(["", "", ""]);
  const [days, setDays] = useState(7);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [weekComparison, setWeekComparison] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);

  const activePostcodes = postcodes.filter(
    (postcode) => /^\d{4}$/.test(postcode.trim())
  );

  const updatePostcode = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);

    setPostcodes((current) =>
      current.map((postcode, i) =>
        i === index ? cleaned : postcode
      )
    );
  };

  const getToken = () => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"))?.token;
    } catch {
      return null;
    }
  };

  const fetchPostcode = async (postcode, dates, token) => {
    const results = await Promise.all(
      dates.map(async (date) => {
        const response = await fetch(`${API_URL}/predict/demand`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            postcode: postcode.trim(),
            date,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.status === "error") {
          throw new Error(
            `${postcode}: ${result.error || result.message || "Forecast failed"}`
          );
        }

        return result;
      })
    );

    return results;
  };

  const fetchCoordinates = async (postcode, token) => {
    try {
      const response = await fetch(
        `${API_URL}/predict/demand/coords/${postcode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  };

  const handleForecast = async () => {
    if (!activePostcodes.length) {
      setError("Please enter at least one valid 4-digit Australian postcode.");
      return;
    }

    setError("");
    setLoading(true);
    setSearched(false);

    try {
      const token = getToken();
      const dates = getDates(days);

      const results = {};

      await Promise.all(
        activePostcodes.map(async (postcode) => {
          results[postcode] = await fetchPostcode(
            postcode,
            dates,
            token
          );
        })
      );

      const merged = dates.map((date, index) => {
        const row = {
          date: displayDate(date),
          rawDate: date,
          weekend: isWeekend(date),
          holiday: isHoliday(date),
        };

        activePostcodes.forEach((postcode) => {
          row[postcode] =
            results[postcode][index]?.predicted_demand_kwh ?? 0;
        });

        return row;
      });

      const values = merged.flatMap((row) =>
        activePostcodes.map((postcode) => row[postcode])
      );

      const globalMin = Math.min(...values);
      const globalMax = Math.max(...values);

      const calculatedStats = {};

      activePostcodes.forEach((postcode) => {
        const values = merged.map((row) => row[postcode]);

        const peak = merged.reduce((a, b) =>
          b[postcode] > a[postcode] ? b : a
        );

        const best = merged.reduce((a, b) =>
          b[postcode] < a[postcode] ? b : a
        );

        const total = values.reduce((sum, value) => sum + value, 0);
        const average = total / values.length;

        const first = values[0] || 1;
        const last = values[values.length - 1] || 0;

        calculatedStats[postcode] = {
          peak,
          best,
          total,
          avg: average,
          trendPct: ((last - first) / first) * 100,
          anomalies: merged.filter(
            (row) =>
              Math.abs(row[postcode] - average) > average * 0.2
          ),
        };
      });

      const coordinates = await Promise.all(
        activePostcodes.map((postcode) =>
          fetchCoordinates(postcode, token)
        )
      );

      const mapMarkers = activePostcodes
        .map((postcode, index) => {
          const coordinate = coordinates[index];

          if (!coordinate) return null;

          return {
            postcode,
            lat: coordinate.lat,
            lon: coordinate.lon,
            avgDemand: calculatedStats[postcode].avg,
            color: getMarkerColor(
              calculatedStats[postcode].avg,
              globalMin,
              globalMax
            ),
            lineColor: COLORS[index],
          };
        })
        .filter(Boolean);

      setData(merged);
      setStats(calculatedStats);
      setMin(globalMin);
      setMax(globalMax);
      setMarkers(mapMarkers);
      setSearched(true);

      if (activePostcodes[0]) {
        const [thisWeek, nextWeek] = await Promise.all([
          fetchPostcode(
            activePostcodes[0],
            getDates(7),
            token
          ),
          fetchPostcode(
            activePostcodes[0],
            getDates(7, 7),
            token
          ),
        ]);

        const thisTotal = thisWeek.reduce(
          (sum, item) => sum + item.predicted_demand_kwh,
          0
        );

        const nextTotal = nextWeek.reduce(
          (sum, item) => sum + item.predicted_demand_kwh,
          0
        );

        setWeekComparison({
          thisTotal,
          nextTotal,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to fetch demand forecast.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "Date",
        "Weekend",
        "Holiday",
        ...activePostcodes.map((pc) => `${pc} (kWh)`),
      ],
      ...data.map((row) => [
        row.date,
        row.weekend ? "Yes" : "No",
        row.holiday ? "Yes" : "No",
        ...activePostcodes.map((pc) =>
          row[pc]?.toFixed(2) || ""
        ),
      ]),
    ];

    const blob = new Blob(
      [rows.map((row) => row.join(",")).join("\n")],
      { type: "text/csv" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `demand_forecast_${activePostcodes.join("_")}.csv`;
    link.click();
  };

  const mapCenter = markers.length
    ? [
        markers.reduce((sum, marker) => sum + marker.lat, 0) /
          markers.length,
        markers.reduce((sum, marker) => sum + marker.lon, 0) /
          markers.length,
      ]
    : [-25.2744, 133.7751];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-black dark:text-white">
      <NavBar />

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-100/30 blur-3xl dark:bg-emerald-950/20" />

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <PulseDot />
            <span className="text-[11px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
              LIVE FORECAST
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            EV Charging Demand{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              Forecast
            </span>
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Predict daily EV charging demand · Up to 3 postcodes · Live
            weather data
          </p>
        </header>

        {/* Input card */}
        <Card className="mb-6">
          <div className="grid gap-4 md:grid-cols-3">
            {postcodes.map((postcode, index) => (
              <label key={index}>
                <span
                  className="mb-2 block text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: COLORS[index] }}
                >
                  Postcode {index + 1} ·{" "}
                  {index === 0 ? "required" : "optional"}
                </span>

                <input
                  value={postcode}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="e.g. 3000"
                  onChange={(e) =>
                    updatePostcode(index, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleForecast();
                    }
                  }}
                  className="
                    w-full rounded-xl border border-slate-200
                    bg-slate-50 px-4 py-3 text-sm text-slate-900
                    outline-none transition-all
                    placeholder:text-slate-400
                    hover:border-emerald-300
                    focus:border-emerald-500
                    focus:bg-white
                    focus:ring-4 focus:ring-emerald-100
                    dark:border-emerald-900/60
                    dark:bg-black
                    dark:text-white
                    dark:placeholder:text-slate-600
                    dark:hover:border-emerald-700
                    dark:focus:border-emerald-500
                    dark:focus:bg-[#020403]
                    dark:focus:ring-emerald-950/60
                  "
                />
              </label>
            ))}
          </div>

          {/* Days */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-emerald-950/60">
            {DAYS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                  days === value
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:border-emerald-900/60 dark:bg-black dark:text-slate-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                }`}
              >
                {value} days
              </button>
            ))}

            <input
              type="range"
              min="1"
              max="16"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="ml-2 min-w-[180px] flex-1 accent-emerald-600"
            />

            <strong className="text-sm text-emerald-600 dark:text-emerald-400">
              {days}d
            </strong>
          </div>

          <button
            type="button"
            onClick={handleForecast}
            disabled={loading}
            className="
              mt-5 inline-flex items-center gap-2 rounded-xl
              bg-emerald-600 px-6 py-3 text-sm font-bold text-white
              shadow-md transition-all
              hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <PulseDot color="#fff" />
                Fetching forecast...
              </>
            ) : (
              "Get Forecast →"
            )}
          </button>
        </Card>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {searched &&
          !loading &&
          activePostcodes.map((postcode, index) => {
            const stat = stats[postcode];

            if (!stat) return null;

            const rising = stat.trendPct >= 0;
            const level = getLevel(stat.avg, min, max);

            return (
              <div key={postcode} className="mb-8">

                <div className="mb-3 flex items-center gap-2">
                  <PulseDot color={COLORS[index]} />

                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: COLORS[index] }}
                  >
                    Postcode {postcode}
                  </span>

                  <span
                    className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                    style={{
                      color: level.color,
                      backgroundColor: level.bg,
                      borderColor: `${level.color}55`,
                    }}
                  >
                    {level.label} Demand
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">

                  <Card className="border-t-2 border-t-red-400">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Peak demand
                    </p>

                    <b className="mt-3 block text-xl text-red-500">
                      {stat.peak?.date}
                    </b>

                    <p className="text-xs text-slate-400">
                      {stat.peak?.[postcode]?.toFixed(1)} kWh
                    </p>

                    <Bar value={90} color="#f87171" />
                  </Card>

                  <Card className="border-t-2 border-t-emerald-400">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Best charging day
                    </p>

                    <b className="mt-3 block text-xl text-emerald-500">
                      {stat.best?.date}
                    </b>

                    <p className="text-xs text-slate-400">
                      {stat.best?.[postcode]?.toFixed(1)} kWh
                    </p>

                    <Bar value={40} color="#34d399" />
                  </Card>

                  <Card
                    className="border-t-2"
                    style={{
                      borderTopColor: rising
                        ? "#f87171"
                        : "#34d399",
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Demand trend
                    </p>

                    <b
                      className={`mt-3 block text-3xl ${
                        rising
                          ? "text-red-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {rising ? "▲" : "▼"}{" "}
                      {Math.abs(stat.trendPct).toFixed(1)}%
                    </b>

                    <p className="text-xs text-slate-400">
                      {rising ? "Rising" : "Falling"} over {days} days
                    </p>
                  </Card>

                  <Card
                    className="border-t-2 md:col-span-3"
                    style={{ borderTopColor: COLORS[index] }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Forecast summary
                    </p>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-400">
                          Total forecast
                        </p>

                        <b
                          className="text-2xl"
                          style={{ color: COLORS[index] }}
                        >
                          {stat.total.toFixed(1)} kWh
                        </b>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Daily average
                        </p>

                        <b className="text-2xl text-blue-500">
                          {stat.avg.toFixed(1)} kWh
                        </b>
                      </div>
                    </div>
                  </Card>
                </div>

                {stat.anomalies?.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs dark:border-amber-500/30 dark:bg-amber-950/30">
                    <b className="text-amber-600">
                      ⚠ Anomalies detected ·{" "}
                    </b>

                    <span className="text-slate-500 dark:text-slate-400">
                      {stat.anomalies
                        .map(
                          (item) =>
                            `${item.date} (${item[postcode]?.toFixed(
                              0
                            )} kWh)`
                        )
                        .join(" · ")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

        {/* Map + heatmap */}
        {searched && !loading && (
          <div className="grid gap-4 lg:grid-cols-2">

            {markers.length > 0 && (
              <Card>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Demand map
                </p>

                <div className="h-[280px] overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-emerald-900/50">
                  <MapContainer
                    center={mapCenter}
                    zoom={markers.length === 1 ? 10 : 5}
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />

                    {markers.map((marker) => (
                      <CircleMarker
                        key={marker.postcode}
                        center={[marker.lat, marker.lon]}
                        radius={20}
                        pathOptions={{
                          fillColor: marker.color,
                          fillOpacity: 0.85,
                          color: marker.lineColor,
                          weight: 3,
                        }}
                      >
                        <Popup>
                          <b>Postcode {marker.postcode}</b>
                          <br />
                          Average: {marker.avgDemand.toFixed(1)} kWh
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </Card>
            )}

            <Card>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Demand heatmap
              </p>

              {activePostcodes.map((postcode, index) => (
                <div key={postcode} className="mb-5">
                  <p
                    className="mb-2 text-xs font-bold"
                    style={{ color: COLORS[index] }}
                  >
                    Postcode {postcode}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {data.map((row) => (
                      <div
                        key={row.rawDate}
                        title={`${row.date}: ${row[
                          postcode
                        ]?.toFixed(1)} kWh`}
                        className="
                          flex h-11 w-11 items-center justify-center
                          rounded-lg text-[10px] font-bold text-white
                          transition-all duration-200
                          hover:scale-110 hover:shadow-lg
                        "
                        style={{
                          backgroundColor: getHeatColor(
                            row[postcode],
                            min,
                            max
                          ),
                          border: `2px solid ${
                            row.holiday
                              ? "#a78bfa"
                              : row.weekend
                              ? "#fbbf24"
                              : "transparent"
                          }`,
                        }}
                      >
                        {row[postcode]?.toFixed(0)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Chart */}
        {searched && !loading && (
          <Card className="mt-4">
            <div className="mb-4 flex flex-wrap justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Predicted demand comparison
              </p>

              <div className="flex gap-3 text-[11px] text-slate-400">
                🟡 Weekend · 🟣 Holiday

                {activePostcodes.map((postcode, index) => (
                  <span
                    key={postcode}
                    style={{ color: COLORS[index] }}
                  >
                    — {postcode}
                  </span>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  width={75}
                />

                <Tooltip
                  content={
                    <TooltipContent min={min} max={max} />
                  }
                />

                {data
                  .filter((row) => row.weekend)
                  .map((row) => (
                    <ReferenceLine
                      key={row.rawDate}
                      x={row.date}
                      stroke="#fbbf2430"
                      strokeWidth={14}
                    />
                  ))}

                {activePostcodes.map((postcode, index) => (
                  <Line
                    key={postcode}
                    type="monotone"
                    dataKey={postcode}
                    stroke={COLORS[index]}
                    strokeWidth={2.5}
                    activeDot={{ r: 7 }}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Week comparison */}
        {searched && weekComparison && (
          <Card className="mt-4">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Week-on-week · {activePostcodes[0]}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-black/60 dark:ring-1 dark:ring-emerald-950/60">
                <p className="text-xs font-semibold text-slate-400">
                  This Week
                </p>

                <b className="mt-2 block text-xl text-emerald-600 dark:text-emerald-400">
                  {weekComparison.thisTotal.toFixed(1)} kWh
                </b>

                <Bar value={65} color="#10b981" />
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-black/60 dark:ring-1 dark:ring-emerald-950/60">
                <p className="text-xs font-semibold text-slate-400">
                  Next Week
                </p>

                <b className="mt-2 block text-xl text-blue-500">
                  {weekComparison.nextTotal.toFixed(1)} kWh
                </b>

                <Bar value={75} color="#60a5fa" />
              </div>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!searched && !loading && !error && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl dark:bg-emerald-950/50">
              📈
            </div>

            <p className="font-semibold text-slate-600 dark:text-slate-300">
              Enter a postcode to get started
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Up to 3 postcodes · 1–16 day forecast · Live weather data
            </p>
          </div>
        )}

        {/* Footer */}
        {searched && !loading && (
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-emerald-950/60">
            <span className="flex items-center gap-2 text-[11px] text-slate-400">
              <PulseDot />
              Powered by Open-Meteo · LightGBM
            </span>

            <button
              type="button"
              onClick={exportCSV}
              className="
                rounded-xl border border-slate-200 bg-white
                px-4 py-2 text-xs font-semibold text-slate-500
                transition-all
                hover:border-emerald-300
                hover:bg-emerald-50
                hover:text-emerald-600
                dark:border-emerald-900/60
                dark:bg-[#050806]
                dark:text-slate-400
                dark:hover:border-emerald-700
                dark:hover:bg-emerald-950/40
                dark:hover:text-emerald-400
              "
            >
              ↓ Export CSV
            </button>
          </footer>
        )}
      </main>
    </div>
  );
}