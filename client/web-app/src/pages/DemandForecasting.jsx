import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import NavBar from "../components/NavBar";
import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL;

const AU_HOLIDAYS_2026 = [
  "2026-01-01", "2026-01-26", "2026-04-03", "2026-04-04",
  "2026-04-05", "2026-04-06", "2026-04-25", "2026-06-08",
  "2026-12-25", "2026-12-26", "2026-12-28",
];

const LINE_COLORS = ["#00b482", "#60a5fa", "#f472b6"];
const PRESET_DAYS = [3, 7, 14, 16];

const formatDate = (d) => d.toISOString().split("T")[0];
const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { weekday: "short", month: "short", day: "numeric" });
};
const isWeekend = (dateStr) => { const d = new Date(dateStr); return d.getDay() === 0 || d.getDay() === 6; };
const isHoliday = (dateStr) => AU_HOLIDAYS_2026.includes(dateStr);

const getNextDates = (n, offsetDays = 0) => Array.from({ length: n }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1 + offsetDays);
  return formatDate(d);
});

const getDemandLevel = (kwh, min, max) => {
  const range = max - min || 1;
  const normalized = (kwh - min) / range;
  if (normalized < 0.33) return { label: "Low", color: "#34d399", bg: "rgba(52,211,153,0.15)" };
  if (normalized < 0.66) return { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" };
  return { label: "High", color: "#f87171", bg: "rgba(248,113,113,0.15)" };
};

const getHeatmapColor = (kwh, min, max) => {
  const range = max - min || 1;
  const t = (kwh - min) / range;
  const r = Math.round(10 + t * 220);
  const g = Math.round(180 - t * 150);
  const b = Math.round(80 - t * 60);
  return `rgb(${r},${g},${b})`;
};

const getMarkerColor = (kwh, min, max) => {
  const range = max - min || 1;
  const t = (kwh - min) / range;
  if (t < 0.33) return "#34d399";
  if (t < 0.66) return "#fbbf24";
  return "#f87171";
};

const CustomTooltip = ({ active, payload, label, globalMin, globalMax }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: "#0f2318", border: "1px solid rgba(0,180,130,0.3)", borderRadius: "8px", padding: "12px 16px", minWidth: "160px" }}>
        <p style={{ color: "#00b482", fontWeight: 700, margin: "0 0 8px 0", fontSize: "13px" }}>{label}</p>
        {payload.map((p, i) => {
          const level = getDemandLevel(p.value, globalMin, globalMax);
          return (
            <div key={i} style={{ marginBottom: "6px" }}>
              <p style={{ color: "#fff", margin: "0 0 4px 0", fontSize: "14px" }}>{p.value?.toFixed(2)} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>kWh</span></p>
              <span style={{ backgroundColor: level.bg, color: level.color, border: `1px solid ${level.color}55`, borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }}>{level.label}</span>
            </div>
          );
        })}
        {payload[0]?.payload?.weekend && <p style={{ color: "#fbbf24", margin: "6px 0 0 0", fontSize: "11px" }}>📅 Weekend</p>}
        {payload[0]?.payload?.holiday && <p style={{ color: "#a78bfa", margin: "4px 0 0 0", fontSize: "11px" }}>🎉 Public Holiday</p>}
      </div>
    );
  }
  return null;
};

// Animated counter hook
function useCountUp(target, duration = 1200, trigger = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger || !target) return;
    setVal(0);
    const steps = 40;
    const inc = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setVal(cur);
      if (cur >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, trigger]);
  return val;
}

// Ring progress component
function Ring({ pct, color, size = 64, children }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (pct / 100) * circ), 100);
    return () => clearTimeout(t);
  }, [pct, circ]);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

// Pulse dot
const PulseDot = ({ color = "#00b482" }) => (
  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10, marginRight: 6 }}>
    <span style={{ position: "absolute", width: 10, height: 10, borderRadius: "50%", backgroundColor: color, opacity: 0.4, animation: "pingAnim 1.4s ease-in-out infinite" }} />
    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
  </span>
);

export default function DemandForecasting() {
  const [postcodes, setPostcodes] = useState(["", "", ""]);
  const [days, setDays] = useState(7);
  const [mergedData, setMergedData] = useState([]);
  const [statsByPc, setStatsByPc] = useState({});
  const [weekComparison, setWeekComparison] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [globalMin, setGlobalMin] = useState(0);
  const [globalMax, setGlobalMax] = useState(100);
  const [ticker, setTicker] = useState(0);

  // Live ticker
  useEffect(() => {
    if (!hasSearched) return;
    const t = setInterval(() => setTicker(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [hasSearched]);

  const getToken = () => JSON.parse(localStorage.getItem("currentUser"))?.token;
  const activePostcodes = postcodes.filter((p) => p.trim() && /^\d{4}$/.test(p.trim()));

  const fetchForPostcode = async (postcode, dates, token) => {
    const results = await Promise.all(
      dates.map((date) =>
        fetch(`${API_URL}/predict/demand`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ postcode: postcode.trim(), date }),
        }).then((r) => r.json())
      )
    );
    const firstError = results.find((r) => r.status === "error" || r.message);
    if (firstError) throw new Error(`${postcode}: ${firstError.error || firstError.message}`);
    return results;
  };

  const fetchCoords = async (postcode, token) => {
    try {
      const res = await fetch(`${API_URL}/predict/demand/coords/${postcode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  };

  const handleForecast = async () => {
    if (activePostcodes.length === 0) { setError("Please enter at least one valid 4-digit Australian postcode."); return; }
    setError(""); setLoading(true); setHasSearched(false); setTicker(0);
    const token = getToken();
    const dates = getNextDates(days);

    try {
      const allResults = {};
      await Promise.all(activePostcodes.map(async (pc) => {
        allResults[pc] = await fetchForPostcode(pc, dates, token);
      }));

      let weekComp = null;
      if (activePostcodes[0]) {
        const [thisWeek, nextWeek] = await Promise.all([
          fetchForPostcode(activePostcodes[0], getNextDates(7), token),
          fetchForPostcode(activePostcodes[0], getNextDates(7, 7), token),
        ]);
        weekComp = {
          thisWeek: thisWeek.map((r) => ({ date: formatDisplayDate(r.date), demand: r.predicted_demand_kwh })),
          nextWeek: nextWeek.map((r) => ({ date: formatDisplayDate(r.date), demand: r.predicted_demand_kwh })),
          thisTotal: thisWeek.reduce((s, r) => s + r.predicted_demand_kwh, 0),
          nextTotal: nextWeek.reduce((s, r) => s + r.predicted_demand_kwh, 0),
        };
      }

      const coordsResults = await Promise.all(activePostcodes.map((pc) => fetchCoords(pc, token)));

      const merged = dates.map((date, i) => {
        const row = { date: formatDisplayDate(date), rawDate: date, weekend: isWeekend(date), holiday: isHoliday(date) };
        activePostcodes.forEach((pc) => { row[pc] = allResults[pc][i].predicted_demand_kwh; });
        return row;
      });

      const stats = {};
      activePostcodes.forEach((pc) => {
        const demands = merged.map((r) => r[pc]);
        const peak = merged.reduce((max, d) => d[pc] > max[pc] ? d : max, merged[0]);
        const best = merged.reduce((min, d) => d[pc] < min[pc] ? d : min, merged[0]);
        const total = demands.reduce((s, v) => s + v, 0);
        const trendPct = ((demands[demands.length - 1] - demands[0]) / demands[0]) * 100;
        const anomalies = merged.filter((d) => {
          const avg = total / demands.length;
          return Math.abs(d[pc] - avg) > avg * 0.2;
        });
        stats[pc] = { peak, best, total, avg: total / demands.length, trendPct, anomalies };
      });

      const allValues = merged.flatMap((r) => activePostcodes.map((pc) => r[pc]));
      const gMin = Math.min(...allValues);
      const gMax = Math.max(...allValues);
      setGlobalMin(gMin);
      setGlobalMax(gMax);

      const markers = activePostcodes.map((pc, idx) => {
        const coords = coordsResults[idx];
        const avgDemand = stats[pc].avg;
        const color = getMarkerColor(avgDemand, gMin, gMax);
        const level = getDemandLevel(avgDemand, gMin, gMax);
        return coords ? { postcode: pc, lat: coords.lat, lon: coords.lon, avgDemand, color, level, lineColor: LINE_COLORS[idx], stats: stats[pc] } : null;
      }).filter(Boolean);

      setMergedData(merged);
      setStatsByPc(stats);
      setWeekComparison(weekComp);
      setMapMarkers(markers);
      setHasSearched(true);
    } catch (err) {
      setError(err.message || "Failed to fetch forecast.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [["Date", "Weekend", "Holiday", ...activePostcodes.map((p) => `${p} (kWh)`)]];
    mergedData.forEach((row) => {
      rows.push([row.date, row.weekend ? "Yes" : "No", row.holiday ? "Yes" : "No", ...activePostcodes.map((p) => row[p]?.toFixed(2) || "")]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `demand_forecast_${activePostcodes.join("_")}.csv`;
    a.click();
  };

  const mapCenter = mapMarkers.length > 0
    ? [mapMarkers.reduce((s, m) => s + m.lat, 0) / mapMarkers.length, mapMarkers.reduce((s, m) => s + m.lon, 0) / mapMarkers.length]
    : [-25.2744, 133.7751];

  const s0 = activePostcodes[0] ? statsByPc[activePostcodes[0]] : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080f0a", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes pingAnim { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(2.2);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .bento-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px; animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .bento-card:nth-child(1){animation-delay:.05s}.bento-card:nth-child(2){animation-delay:.1s}.bento-card:nth-child(3){animation-delay:.15s}.bento-card:nth-child(4){animation-delay:.2s}.bento-card:nth-child(5){animation-delay:.25s}.bento-card:nth-child(6){animation-delay:.3s}.bento-card:nth-child(7){animation-delay:.35s}.bento-card:nth-child(8){animation-delay:.4s}
        .card-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: rgba(255,255,255,0.35); margin: 0 0 8px 0; text-transform: uppercase; }
        .card-value { font-size: 24px; font-weight: 700; margin: 0; }
        .card-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin: 4px 0 0 0; }
        .mini-bar-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; flex: 1; }
        .mini-bar-fill { height: 100%; border-radius: 2px; transition: width 1.4s ease; }
      `}</style>

      <NavBar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "rgba(0,180,130,0.12)", border: "1px solid rgba(0,180,130,0.25)", borderRadius: "20px", padding: "4px 14px", marginBottom: "14px" }}>
              <PulseDot />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", color: "#00b482" }}>LIVE FORECAST</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0" }}>EV Charging Demand <span style={{ color: "#00b482" }}>Forecast</span></h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>Predict daily EV charging demand · Up to 3 postcodes · Powered by live weather</p>
          </div>
          {hasSearched && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(0,180,130,0.08)", border: "1px solid rgba(0,180,130,0.2)", borderRadius: "8px", padding: "8px 16px" }}>
              <PulseDot />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Updated {ticker}s ago</span>
            </div>
          )}
        </div>

        {/* Input Panel */}
        <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            {postcodes.map((pc, i) => (
              <div key={i} style={{ flex: 1, minWidth: "140px" }}>
                <label style={{ color: LINE_COLORS[i], fontSize: "10px", fontWeight: 700, letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                  POSTCODE {i + 1} {i === 0 ? "·  required" : "· optional"}
                </label>
                <input type="text" value={pc} maxLength={4}
                  onChange={(e) => { const u = [...postcodes]; u[i] = e.target.value; setPostcodes(u); }}
                  onKeyDown={(e) => e.key === "Enter" && handleForecast()}
                  placeholder="e.g. 3000"
                  style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.06)", border: `1px solid ${LINE_COLORS[i]}44`, borderRadius: "8px", padding: "10px 14px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
              {PRESET_DAYS.map((d) => (
                <button key={d} onClick={() => setDays(d)} style={{ backgroundColor: days === d ? "#00b482" : "rgba(255,255,255,0.05)", color: days === d ? "#fff" : "rgba(255,255,255,0.45)", border: `1px solid ${days === d ? "#00b482" : "rgba(255,255,255,0.08)"}`, borderRadius: "20px", padding: "5px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>{d} days</button>
              ))}
              <span style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "200px" }}>
                <input type="range" min={1} max={16} value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ flex: 1, accentColor: "#00b482" }} />
                <span style={{ color: "#00b482", fontWeight: 700, fontSize: "16px", minWidth: "50px" }}>{days}d</span>
              </span>
            </div>
          </div>
          <button onClick={handleForecast} disabled={loading} style={{ backgroundColor: loading ? "rgba(0,180,130,0.3)" : "#00b482", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 28px", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
            {loading ? (<><PulseDot color="#fff" /> Fetching live weather & running model...</>) : "Get Forecast →"}
          </button>
        </div>

        {/* Error */}
        {error && <div style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "14px 20px", color: "#f87171", marginBottom: "20px", fontSize: "14px" }}>{error}</div>}

        {/* Results — Bento Grid */}
        {hasSearched && !loading && activePostcodes.map((pc, idx) => {
          const s = statsByPc[pc];
          if (!s) return null;
          const trendUp = s.trendPct >= 0;
          const totalPct = Math.min((s.total / (s.total * 1.4)) * 100, 100);
          const avgPct = Math.min((s.avg / globalMax) * 100, 100);

          return (
            <div key={pc} style={{ marginBottom: "32px" }}>
              {/* Postcode header */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <PulseDot color={LINE_COLORS[idx]} />
                <span style={{ color: LINE_COLORS[idx], fontSize: "13px", fontWeight: 700, letterSpacing: "1px" }}>POSTCODE {pc}</span>
                <span style={{ backgroundColor: getDemandLevel(s.avg, globalMin, globalMax).bg, color: getDemandLevel(s.avg, globalMin, globalMax).color, fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "20px", border: `1px solid ${getDemandLevel(s.avg, globalMin, globalMax).color}55` }}>
                  {getDemandLevel(s.avg, globalMin, globalMax).label} Demand
                </span>
              </div>

              {/* Bento grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px" }}>

                {/* Peak day — span 2 */}
                <div className="bento-card" style={{ gridColumn: "span 2", borderTop: `2px solid #f87171` }}>
                  <p className="card-label">Peak demand day</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p className="card-value" style={{ color: "#f87171", fontSize: "20px" }}>{s.peak?.date}</p>
                      <p className="card-sub">{s.peak?.[pc]?.toFixed(1)} kWh</p>
                    </div>
                    <Ring pct={Math.min(((s.peak?.[pc] - globalMin) / (globalMax - globalMin)) * 100, 100)} color="#f87171" size={60}>
                      <span style={{ fontSize: "10px", color: "#f87171", fontWeight: 700 }}>HIGH</span>
                    </Ring>
                  </div>
                </div>

                {/* Best charging day — span 2 */}
                <div className="bento-card" style={{ gridColumn: "span 2", borderTop: `2px solid #34d399` }}>
                  <p className="card-label">Best charging day</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p className="card-value" style={{ color: "#34d399", fontSize: "20px" }}>{s.best?.date}</p>
                      <p className="card-sub">{s.best?.[pc]?.toFixed(1)} kWh · lowest demand</p>
                    </div>
                    <Ring pct={Math.min(((s.best?.[pc] - globalMin) / (globalMax - globalMin)) * 100, 100)} color="#34d399" size={60}>
                      <span style={{ fontSize: "10px", color: "#34d399", fontWeight: 700 }}>LOW</span>
                    </Ring>
                  </div>
                </div>

                {/* Trend — span 2 */}
                <div className="bento-card" style={{ gridColumn: "span 2", borderTop: `2px solid ${trendUp ? "#f87171" : "#34d399"}` }}>
                  <p className="card-label">Demand trend</p>
                  <p className="card-value" style={{ color: trendUp ? "#f87171" : "#34d399", fontSize: "28px" }}>
                    {trendUp ? "▲" : "▼"} {Math.abs(s.trendPct).toFixed(1)}%
                  </p>
                  <p className="card-sub">{trendUp ? "Rising" : "Falling"} over {days} days</p>
                </div>

                {/* Total — span 3 */}
                <div className="bento-card" style={{ gridColumn: "span 3", borderTop: `2px solid ${LINE_COLORS[idx]}` }}>
                  <p className="card-label">Total forecasted</p>
                  <p className="card-value" style={{ color: LINE_COLORS[idx] }}>{s.total?.toFixed(1)} kWh</p>
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ height: "5px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${totalPct}%`, backgroundColor: LINE_COLORS[idx], borderRadius: "3px", transition: "width 1.4s ease" }} />
                    </div>
                  </div>
                  <p className="card-sub" style={{ marginTop: "6px" }}>Over {days} days</p>
                </div>

                {/* Daily avg — span 3 */}
                <div className="bento-card" style={{ gridColumn: "span 3", borderTop: `2px solid #60a5fa` }}>
                  <p className="card-label">Daily average</p>
                  <p className="card-value" style={{ color: "#60a5fa" }}>{s.avg?.toFixed(1)} kWh</p>
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ height: "5px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${avgPct}%`, backgroundColor: "#60a5fa", borderRadius: "3px", transition: "width 1.4s ease" }} />
                    </div>
                  </div>
                  <p className="card-sub" style={{ marginTop: "6px" }}>Per day average</p>
                </div>

              </div>

              {/* Anomalies */}
              {s.anomalies?.length > 0 && (
                <div style={{ marginTop: "10px", backgroundColor: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "12px 18px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ fontSize: "16px", marginTop: "1px" }}>⚠</span>
                  <div>
                    <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: "12px" }}>Anomalies detected · </span>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{s.anomalies.map((a) => `${a.date} (${a[pc]?.toFixed(0)} kWh)`).join(" · ")}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Map + Heatmap side by side */}
        {hasSearched && !loading && (
          <div style={{ display: "grid", gridTemplateColumns: mapMarkers.length > 0 ? "1fr 1fr" : "1fr", gap: "12px", marginBottom: "16px" }}>

            {/* Map */}
            {mapMarkers.length > 0 && (
              <div className="bento-card" style={{ padding: "20px" }}>
                <p className="card-label" style={{ marginBottom: "12px" }}>📍 Demand map overlay</p>
                <div style={{ borderRadius: "10px", overflow: "hidden", height: "280px" }}>
                  <MapContainer center={mapCenter} zoom={mapMarkers.length === 1 ? 10 : 5} style={{ height: "100%", width: "100%" }} key={mapMarkers.map((m) => m.postcode).join("-")}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    {mapMarkers.map((marker) => (
                      <CircleMarker key={marker.postcode} center={[marker.lat, marker.lon]} radius={20} pathOptions={{ fillColor: marker.color, fillOpacity: 0.85, color: marker.lineColor, weight: 3 }}>
                        <Popup>
                          <div style={{ minWidth: "160px" }}>
                            <p style={{ fontWeight: 700, margin: "0 0 6px 0" }}>Postcode {marker.postcode}</p>
                            <p style={{ margin: "0 0 3px 0", fontSize: "12px" }}>Avg: <strong>{marker.avgDemand.toFixed(1)} kWh</strong></p>
                            <p style={{ margin: "0 0 3px 0", fontSize: "12px" }}>Peak: <strong>{marker.stats.peak?.[marker.postcode]?.toFixed(1)} kWh</strong></p>
                            <p style={{ margin: "0 0 3px 0", fontSize: "12px" }}>Best: <strong>{marker.stats.best?.date}</strong></p>
                            <span style={{ backgroundColor: marker.level.bg, color: marker.level.color, border: `1px solid ${marker.level.color}`, borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>{marker.level.label}</span>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Heatmap */}
            <div className="bento-card" style={{ padding: "20px" }}>
              <p className="card-label" style={{ marginBottom: "12px" }}>🗓 Demand heatmap calendar</p>
              {activePostcodes.map((pc, idx) => (
                <div key={pc} style={{ marginBottom: "14px" }}>
                  <p style={{ color: LINE_COLORS[idx], fontSize: "11px", fontWeight: 600, margin: "0 0 8px 0" }}>Postcode {pc}</p>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {mergedData.map((d) => {
                      const color = getHeatmapColor(d[pc], globalMin, globalMax);
                      const level = getDemandLevel(d[pc], globalMin, globalMax);
                      return (
                        <div key={d.rawDate} title={`${d.date}: ${d[pc]?.toFixed(1)} kWh (${level.label})`}
                          style={{ width: "44px", height: "44px", borderRadius: "6px", backgroundColor: color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", border: d.holiday ? "2px solid #a78bfa" : d.weekend ? "2px solid #fbbf24" : "2px solid transparent", cursor: "default" }}>
                          <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{d.date.split(" ").slice(0, 2).join(" ")}</span>
                          <span style={{ fontSize: "9px", color: "#fff", fontWeight: 800 }}>{d[pc]?.toFixed(0)}</span>
                          {d.holiday && <span style={{ position: "absolute", top: "-5px", right: "-5px", fontSize: "9px" }}>🎉</span>}
                          {d.weekend && !d.holiday && <span style={{ position: "absolute", top: "-5px", right: "-5px", fontSize: "9px" }}>📅</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>Low</span>
                <div style={{ background: "linear-gradient(90deg, rgb(10,180,80), rgb(230,30,20))", height: "5px", width: "80px", borderRadius: "3px" }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>High</span>
              </div>
            </div>
          </div>
        )}

        {/* Line Chart */}
        {hasSearched && !loading && (
          <div className="bento-card" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <p className="card-label" style={{ margin: 0 }}>📈 Predicted demand comparison</p>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "rgba(255,255,255,0.35)", flexWrap: "wrap" }}>
                <span>🟡 Weekend</span><span>🟣 Holiday</span>
                {activePostcodes.map((pc, i) => <span key={pc} style={{ color: LINE_COLORS[i] }}>— {pc}</span>)}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mergedData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} kWh`} width={80} />
                <Tooltip content={<CustomTooltip globalMin={globalMin} globalMax={globalMax} />} />
                {mergedData.filter((d) => d.weekend).map((d) => <ReferenceLine key={d.rawDate} x={d.date} stroke="#fbbf2418" strokeWidth={14} />)}
                {mergedData.filter((d) => d.holiday).map((d) => <ReferenceLine key={d.rawDate + "_h"} x={d.date} stroke="#a78bfa28" strokeWidth={14} />)}
                {activePostcodes.map((pc, idx) => (
                  <Line key={pc} type="monotone" dataKey={pc} stroke={LINE_COLORS[idx]} strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return <circle key={payload.rawDate + pc} cx={cx} cy={cy} r={payload.holiday ? 6 : payload.weekend ? 5 : 3.5} fill={payload.holiday ? "#a78bfa" : payload.weekend ? "#fbbf24" : LINE_COLORS[idx]} stroke={LINE_COLORS[idx]} strokeWidth={2} />;
                    }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Week on Week */}
        {hasSearched && !loading && weekComparison && (
          <div className="bento-card" style={{ marginBottom: "12px" }}>
            <p className="card-label" style={{ marginBottom: "14px" }}>🔁 Week-on-week comparison · Postcode {activePostcodes[0]}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              {[
                { label: "This Week", value: weekComparison.thisTotal.toFixed(1), color: "#00b482", pct: 65 },
                { label: "Next Week", value: weekComparison.nextTotal.toFixed(1), color: "#60a5fa", pct: Math.min((weekComparison.nextTotal / weekComparison.thisTotal) * 65, 100) },
              ].map((c) => (
                <div key={c.label}>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "0 0 6px 0" }}>{c.label}</p>
                  <div style={{ height: "5px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, backgroundColor: c.color, borderRadius: "3px", transition: "width 1.4s ease" }} />
                  </div>
                  <p style={{ color: c.color, fontSize: "20px", fontWeight: 700, margin: 0 }}>{c.value} kWh</p>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: weekComparison.nextTotal > weekComparison.thisTotal ? "rgba(248,113,113,0.07)" : "rgba(52,211,153,0.07)", border: `1px solid ${weekComparison.nextTotal > weekComparison.thisTotal ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)"}`, borderRadius: "8px", padding: "10px 16px" }}>
              <span style={{ color: weekComparison.nextTotal > weekComparison.thisTotal ? "#f87171" : "#34d399", fontWeight: 700, fontSize: "13px" }}>
                {weekComparison.nextTotal > weekComparison.thisTotal ? "▲" : "▼"} Next week is {Math.abs(((weekComparison.nextTotal - weekComparison.thisTotal) / weekComparison.thisTotal) * 100).toFixed(1)}% {weekComparison.nextTotal > weekComparison.thisTotal ? "higher" : "lower"} than this week
              </span>
            </div>
          </div>
        )}

        {/* Footer row */}
        {hasSearched && !loading && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <PulseDot />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>Powered by Open-Meteo live weather · LightGBM ML model</span>
            </div>
            <button onClick={handleExportCSV} style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 20px", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
              ⬇ Export CSV
            </button>
          </div>
        )}

        {/* Empty state */}
        {!hasSearched && !loading && !error && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px", opacity: 0.6 }}>📈</div>
            <p style={{ fontSize: "16px", margin: "0 0 8px 0", color: "rgba(255,255,255,0.3)" }}>Enter a postcode to get started</p>
            <p style={{ fontSize: "13px", margin: 0, color: "rgba(255,255,255,0.15)" }}>Up to 3 postcodes · 1–16 day forecast · Live weather data</p>
          </div>
        )}
      </div>
    </div>
  );
}