import React, { useState, useEffect } from "react";
import {
  getCostComparison,
  getCostCharts,
  getEvVehicles,
  getIceVehicles,
} from "../services/costComparisionTool";
import CostCharts from "./CostCharts";
import "../styles/Validation.css";

const PulseDot = ({ color = "#00b482" }) => (
  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10, marginRight: 6 }}>
    <span style={{ position: "absolute", width: 10, height: 10, borderRadius: "50%", backgroundColor: color, opacity: 0.4, animation: "pingAnim 1.4s ease-in-out infinite" }} />
    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
  </span>
);

function Ring({ pct, color, size = 56, children }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (pct / 100) * circ), 400);
    return () => clearTimeout(t);
  }, [pct, circ]);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  marginBottom: "4px",
  boxSizing: "border-box",
};

const inputStyle = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  marginBottom: "4px",
  boxSizing: "border-box",
};

export default function CostCalculation() {
  const [evVehicles, setEvVehicles] = useState({});
  const [evMake, setEvMake] = useState("");
  const [evModel, setEvModel] = useState("");
  const [evVariant, setEvVariant] = useState("");

  const [iceVehicles, setIceVehicles] = useState({});
  const [iceMake, setIceMake] = useState("");
  const [iceModel, setIceModel] = useState("");
  const [iceVariant, setIceVariant] = useState("");

  const [kmsPerDay, setKmsPerDay] = useState("");
  const [electricityCost, setElectricityCost] = useState("");
  const [petrolPrice, setPetrolPrice] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [ticker, setTicker] = useState(0);

  const tokenFull = localStorage.getItem("currentUser");
  const token = tokenFull ? JSON.parse(tokenFull).token : null;

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const [evData, iceData] = await Promise.all([
          getEvVehicles(token),
          getIceVehicles(token),
        ]);
        setEvVehicles(evData);
        setIceVehicles(iceData);
      } catch (err) {
        console.error("Failed to load vehicles:", err);
      }
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    if (!serverResult) return;
    const t = setInterval(() => setTicker(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [serverResult]);

  const evMakes    = Object.keys(evVehicles).sort();
  const evModels   = evMake ? Object.keys(evVehicles[evMake] || {}).sort() : [];
  const evVariants = evMake && evModel ? evVehicles[evMake]?.[evModel] || [] : [];

  const iceMakes    = Object.keys(iceVehicles).sort();
  const iceModels   = iceMake ? Object.keys(iceVehicles[iceMake] || {}).sort() : [];
  const iceVariants = iceMake && iceModel ? iceVehicles[iceMake]?.[iceModel] || [] : [];

  const validate = () => {
    const errs = {};
    if (!evMake)  errs.evMake  = "Please select an EV make";
    if (!evModel) errs.evModel = "Please select an EV model";
    if (!iceMake)  errs.iceMake  = "Please select a petrol car make";
    if (!iceModel) errs.iceModel = "Please select a petrol car model";
    if (!kmsPerDay.trim() || Number(kmsPerDay) <= 0) errs.kmsPerDay = "Please enter average km per day";
    if (!electricityCost.trim() || Number(electricityCost) <= 0) errs.electricityCost = "Please enter electricity rate";
    if (!petrolPrice.trim() || Number(petrolPrice) <= 0) errs.petrolPrice = "Please enter petrol price";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setServerError("");
    setServerResult(null);
    setChartData(null);
    setTicker(0);
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        distance_km: parseFloat(kmsPerDay),
        electricity_price_per_kwh: parseFloat(electricityCost),
        petrol_price_per_l: parseFloat(petrolPrice),
        ev_make: evMake, ev_model: evModel, ev_variant: evVariant || null,
        ice_make: iceMake, ice_model: iceModel, ice_variant: iceVariant || null,
      };
      const [response, charts] = await Promise.all([
        getCostComparison(payload, token),
        getCostCharts(payload, token),
      ]);
      setServerResult(response);
      setChartData(charts);
    } catch (err) {
      setServerError(err.message || "Error contacting comparison service");
    } finally {
      setLoading(false);
    }
  };

  const savings = serverResult?.predicted_savings ?? 0;
  const savingsPositive = savings > 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080f0a", fontFamily: "'Segoe UI', sans-serif", padding: "40px 24px" }}>
      <style>{`
        @keyframes pingAnim { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(2.2);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .bento-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px; animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .bento-card:nth-child(1){animation-delay:.05s}.bento-card:nth-child(2){animation-delay:.1s}.bento-card:nth-child(3){animation-delay:.15s}.bento-card:nth-child(4){animation-delay:.2s}.bento-card:nth-child(5){animation-delay:.25s}.bento-card:nth-child(6){animation-delay:.3s}
        .card-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: rgba(255,255,255,0.35); margin: 0 0 8px 0; text-transform: uppercase; }
        .field-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.5px; display: block; margin-bottom: 6px; margin-top: 14px; }
        select option { background: #1a2035; color: #fff; }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "rgba(0,180,130,0.12)", border: "1px solid rgba(0,180,130,0.25)", borderRadius: "20px", padding: "4px 14px", marginBottom: "14px" }}>
              <PulseDot />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", color: "#00b482" }}>COST COMPARISON</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0" }}>EV vs Petrol <span style={{ color: "#00b482" }}>Cost Analysis</span></h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>Daily running cost estimate · ML-powered savings prediction · Melbourne 2026</p>
          </div>
          {serverResult && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(0,180,130,0.08)", border: "1px solid rgba(0,180,130,0.2)", borderRadius: "8px", padding: "8px 16px" }}>
              <PulseDot />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Calculated {ticker}s ago</span>
            </div>
          )}
        </div>

        {/* Main layout */}
        <div style={{ display: "grid", gridTemplateColumns: serverResult ? "1fr 1fr" : "1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Form */}
          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

              {/* EV */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00b482", display: "inline-block" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#00b482", letterSpacing: "1px" }}>ELECTRIC VEHICLE</span>
                </div>
                <label className="field-label" style={{ marginTop: 0 }}>Make</label>
                <select style={selectStyle} value={evMake} onChange={e => { setEvMake(e.target.value); setEvModel(""); setEvVariant(""); }}>
                  <option value="">Select make</option>
                  {evMakes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {formErrors.evMake && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.evMake}</span>}

                <label className="field-label">Model</label>
                <select style={selectStyle} value={evModel} onChange={e => { setEvModel(e.target.value); setEvVariant(""); }} disabled={!evMake}>
                  <option value="">Select model</option>
                  {evModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {formErrors.evModel && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.evModel}</span>}

                <label className="field-label">Variant <span style={{ color: "rgba(255,255,255,0.3)" }}>(optional)</span></label>
                <select style={selectStyle} value={evVariant} onChange={e => setEvVariant(e.target.value)} disabled={!evModel}>
                  <option value="">Select variant</option>
                  {evVariants.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {/* ICE */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f87171", display: "inline-block" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#f87171", letterSpacing: "1px" }}>PETROL VEHICLE</span>
                </div>
                <label className="field-label" style={{ marginTop: 0 }}>Make</label>
                <select style={selectStyle} value={iceMake} onChange={e => { setIceMake(e.target.value); setIceModel(""); setIceVariant(""); }}>
                  <option value="">Select make</option>
                  {iceMakes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {formErrors.iceMake && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.iceMake}</span>}

                <label className="field-label">Model</label>
                <select style={selectStyle} value={iceModel} onChange={e => { setIceModel(e.target.value); setIceVariant(""); }} disabled={!iceMake}>
                  <option value="">Select model</option>
                  {iceModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {formErrors.iceModel && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.iceModel}</span>}

                <label className="field-label">Variant <span style={{ color: "rgba(255,255,255,0.3)" }}>(optional)</span></label>
                <select style={selectStyle} value={iceVariant} onChange={e => setIceVariant(e.target.value)} disabled={!iceModel}>
                  <option value="">Select variant</option>
                  {iceVariants.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Trip details */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#60a5fa", display: "inline-block" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", letterSpacing: "1px" }}>TRIP DETAILS</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="field-label" style={{ marginTop: 0 }}>Avg km per day</label>
                  <input style={inputStyle} type="number" min="1" step="1" value={kmsPerDay}
                    onChange={e => { setKmsPerDay(e.target.value); setFormErrors(p => ({ ...p, kmsPerDay: "" })); }}
                    placeholder="e.g. 40" />
                  {formErrors.kmsPerDay && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.kmsPerDay}</span>}
                </div>
                <div>
                  <label className="field-label" style={{ marginTop: 0 }}>Electricity ($/kWh)</label>
                  <input style={inputStyle} type="number" min="0.01" step="0.01" value={electricityCost}
                    onChange={e => { setElectricityCost(e.target.value); setFormErrors(p => ({ ...p, electricityCost: "" })); }}
                    placeholder="e.g. 0.30" />
                  {formErrors.electricityCost && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.electricityCost}</span>}
                </div>
                <div>
                  <label className="field-label" style={{ marginTop: 0 }}>Petrol ($/L)</label>
                  <input style={inputStyle} type="number" min="0.01" step="0.01" value={petrolPrice}
                    onChange={e => { setPetrolPrice(e.target.value); setFormErrors(p => ({ ...p, petrolPrice: "" })); }}
                    placeholder="e.g. 2.00" />
                  {formErrors.petrolPrice && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.petrolPrice}</span>}
                </div>
              </div>
            </div>

            <button onClick={handleCalculate} disabled={loading}
              style={{ backgroundColor: loading ? "rgba(0,180,130,0.3)" : "#00b482", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 28px", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {loading ? (<><PulseDot color="#fff" />Calculating...</>) : "Calculate & Compare →"}
            </button>

            {serverError && (
              <div style={{ marginTop: "12px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "12px 16px", color: "#f87171", fontSize: "13px" }}>
                {serverError}
              </div>
            )}
          </div>

          {/* Results */}
          {serverResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ backgroundColor: savingsPositive ? "rgba(52,211,153,0.07)" : "rgba(248,113,113,0.07)", border: `1px solid ${savingsPositive ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: "14px", padding: "24px", textAlign: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.35)", margin: "0 0 10px 0" }}>PREDICTED SAVINGS · EV VS PETROL</p>
                <p style={{ fontSize: "48px", fontWeight: 800, color: savingsPositive ? "#34d399" : "#f87171", margin: "0 0 6px 0" }}>
                  {savingsPositive ? "+" : "-"}${Math.abs(savings).toFixed(2)}
                </p>
                <span style={{ fontSize: "12px", backgroundColor: savingsPositive ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: savingsPositive ? "#34d399" : "#f87171", padding: "4px 14px", borderRadius: "20px", border: `1px solid ${savingsPositive ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}` }}>
                  {savingsPositive ? "EV is cheaper for this trip" : "Petrol is cheaper for this trip"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { label: "EV trip cost", value: `$${serverResult.ev_trip_cost?.toFixed(2) ?? "—"}`, color: "#00b482", pct: 40, icon: "⚡" },
                  { label: "Petrol trip cost", value: `$${serverResult.ice_trip_cost?.toFixed(2) ?? "—"}`, color: "#f87171", pct: 70, icon: "⛽" },
                  { label: "CO₂ saved", value: `${serverResult.co2_saved_kg?.toFixed(2) ?? "—"} kg`, color: "#34d399", pct: 60, icon: "🌿" },
                ].map(({ label, value, color, pct, icon }) => (
                  <div key={label} className="bento-card" style={{ textAlign: "center", borderTop: `2px solid ${color}` }}>
                    <p className="card-label">{label}</p>
                    <Ring pct={pct} color={color} size={56} key={label + ticker}>
                      <span style={{ fontSize: "12px" }}>{icon}</span>
                    </Ring>
                    <p style={{ color, fontSize: "16px", fontWeight: 700, margin: "8px 0 0 0" }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "EV emissions", value: `${serverResult.ev_co2_kg?.toFixed(2) ?? "—"} kg`, color: "#00b482", pct: 30 },
                  { label: "ICE emissions", value: `${serverResult.ice_co2_kg?.toFixed(2) ?? "—"} kg`, color: "#f87171", pct: 80 },
                ].map(({ label, value, color, pct }) => (
                  <div key={label} className="bento-card">
                    <p className="card-label">{label}</p>
                    <p style={{ color, fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0" }}>{value}</p>
                    <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "2px", transition: "width 1.4s ease" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" }}>
                <PulseDot color="#60a5fa" />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>ML model: {serverResult.model_version}</span>
              </div>
            </div>
          )}
        </div>

        {chartData && <CostCharts chartData={chartData} />}

        {!serverResult && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px", opacity: 0.5 }}>⚡</div>
            <p style={{ fontSize: "16px", margin: "0 0 8px 0", color: "rgba(255,255,255,0.3)" }}>Select vehicles and enter trip details to compare costs</p>
            <p style={{ fontSize: "13px", margin: 0, color: "rgba(255,255,255,0.15)" }}>Powered by LightGBM ML model</p>
          </div>
        )}
      </div>
    </div>
  );
}