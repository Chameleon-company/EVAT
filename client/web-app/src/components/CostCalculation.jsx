import React, { useState, useEffect } from "react";
import {
  getCostComparison,
  getCostCharts,
  getEvVehicles,
  getIceVehicles,
} from "../services/costComparisionTool";
import CostCharts from "./CostCharts";
import { Button } from "./Button.tsx";
import { Input } from "./Input.tsx";
import "./CostCalculation.css";

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
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <section className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
        <span
          className="
            mb-4 inline-flex items-center rounded-full
            border border-emerald-200 bg-emerald-50
            px-3.5 py-1.5 text-xs font-semibold uppercase
            text-emerald-700
            dark:border-emerald-900/70
            dark:bg-emerald-950/50
            dark:text-emerald-400
          "
        >
          Cost Comparison
        </span>

        <h1
          className="
            text-4xl font-bold tracking-tight text-surface-900
            sm:text-5xl
          "
        >
          EV vs Petrol{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            Cost Analysis
          </span>
        </h1>

        <p
          className="
            mx-auto mt-4 max-w-2xl text-sm leading-6 text-surface-500
            sm:text-base
            dark:text-surface-700/75
          "
        >
          Daily running cost estimate · ML-powered savings prediction · Melbourne 2026
        </p>
      </section>

      {serverResult && (
        <div className="flex items-center gap-2 bg-[#00b482]/8 border border-[#00b482]/20 rounded-lg px-4 py-2">
          <PulseDot />
          <span className="text-xs text-surface-950/50">Calculated {ticker}s ago</span>
        </div>
      )}

      {/* Main layout */}
      <div className={`grid gap-4 mb-4 ${serverResult ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>

        {/* Form */}
        <div className="bg-foreground/1 border border-foreground/10 rounded-[14px] p-6">
          <div className="grid grid-cols-2 gap-4 mb-5">

            {/* EV */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                <span className="text-xs font-bold text-primary tracking-[1px]">ELECTRIC VEHICLE</span>
              </div>
              <label className="text-sm font-semibold text-surface-400 tracking-[0.5px] block mb-1.5 mt-0">Make</label>
              <select className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-surface-950 text-sm outline-none focus:border-primary" value={evMake} onChange={e => { setEvMake(e.target.value); setEvModel(""); setEvVariant(""); }}>
                <option value="">Select make</option>
                {evMakes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {formErrors.evMake && <span className="text-[#f87171] text-sm">{formErrors.evMake}</span>}

              <label className="text-sm font-semibold text-surface-400 tracking-[0.5px] block mb-1.5 mt-3.5">Model</label>
              <select className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-surface-950 text-sm outline-none focus:border-primary disabled:opacity-50" value={evModel} onChange={e => { setEvModel(e.target.value); setEvVariant(""); }} disabled={!evMake}>
                <option value="">Select model</option>
                {evModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {formErrors.evModel && <span className="text-[#f87171] text-sm">{formErrors.evModel}</span>}

              <label className="text-sm font-semibold text-surface-400 tracking-[0.5px] block mb-1.5 mt-3.5">Variant <span className="text-surface-950/30">(optional)</span></label>
              <select className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-surface-950 text-sm outline-none focus:border-primary disabled:opacity-50" value={evVariant} onChange={e => setEvVariant(e.target.value)} disabled={!evModel}>
                <option value="">Select variant</option>
                {evVariants.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* ICE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#f87171] inline-block" />
                <span className="text-xs font-bold text-[#f87171] tracking-[1px]">PETROL VEHICLE</span>
              </div>
              <label className="text-sm font-semibold text-surface-400 tracking-[0.5px] block mb-1.5 mt-0">Make</label>
              <select className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-surface-950 text-sm outline-none focus:border-[#f87171]" value={iceMake} onChange={e => { setIceMake(e.target.value); setIceModel(""); setIceVariant(""); }}>
                <option value="">Select make</option>
                {iceMakes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {formErrors.iceMake && <span className="text-[#f87171] text-sm">{formErrors.iceMake}</span>}

              <label className="text-sm font-semibold text-surface-400 tracking-[0.5px] block mb-1.5 mt-3.5">Model</label>
              <select className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-surface-950 text-sm outline-none focus:border-[#f87171] disabled:opacity-50" value={iceModel} onChange={e => { setIceModel(e.target.value); setIceVariant(""); }} disabled={!iceMake}>
                <option value="">Select model</option>
                {iceModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {formErrors.iceModel && <span className="text-[#f87171] text-sm">{formErrors.iceModel}</span>}

              <label className="text-sm font-semibold text-surface-400 tracking-[0.5px] block mb-1.5 mt-3.5">Variant <span className="text-surface-950/30">(optional)</span></label>
              <select className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-surface-950 text-sm outline-none focus:border-[#f87171] disabled:opacity-50" value={iceVariant} onChange={e => setIceVariant(e.target.value)} disabled={!iceModel}>
                <option value="">Select variant</option>
                {iceVariants.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Trip details */}
          <div className="border-t border-white/6 pt-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#60a5fa] inline-block" />
              <span className="text-xs font-bold text-[#60a5fa] tracking-[1px]">TRIP DETAILS</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-semibold text-surface-950/45 tracking-[0.5px] block mb-1.5 mt-0">Avg km per day</label>
                <Input className="w-full bg-foreground/5 text-surface-950 placeholder:text-surface-600" type="number" min="1" step="1" value={kmsPerDay}
                  onChange={e => { setKmsPerDay(e.target.value); setFormErrors(p => ({ ...p, kmsPerDay: "" })); }}
                  placeholder="e.g. 40" />
                {formErrors.kmsPerDay && <span className="text-[#f87171] text-sm">{formErrors.kmsPerDay}</span>}
              </div>
              <div>
                <label className="text-sm font-semibold text-surface-950/45 tracking-[0.5px] block mb-1.5 mt-0">Electricity ($/kWh)</label>
                <Input className="w-full bg-foreground/5 text-surface-950 placeholder:text-surface-600" type="number" min="0.01" step="0.01" value={electricityCost}
                  onChange={e => { setElectricityCost(e.target.value); setFormErrors(p => ({ ...p, electricityCost: "" })); }}
                  placeholder="e.g. 0.30" />
                {formErrors.electricityCost && <span className="text-[#f87171] text-sm">{formErrors.electricityCost}</span>}
              </div>
              <div>
                <label className="text-sm font-semibold text-surface-950/45 tracking-[0.5px] block mb-1.5 mt-0">Petrol ($/L)</label>
                <Input className="w-full bg-foreground/5 text-surface-950 placeholder:text-surface-600" type="number" min="0.01" step="0.01" value={petrolPrice}
                  onChange={e => { setPetrolPrice(e.target.value); setFormErrors(p => ({ ...p, petrolPrice: "" })); }}
                  placeholder="e.g. 2.00" />
                {formErrors.petrolPrice && <span className="text-[#f87171] text-sm">{formErrors.petrolPrice}</span>}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            variant="primary"
            loading={loading}
            loadingLabel="Calculating..."
          >
            {loading ? <PulseDot className="text-foreground" /> : "Calculate & Compare →"}
          </Button>

          {serverError && (
            <div className="mt-3 bg-red-500/8 border border-red-500/20 rounded-lg p-3 text-[#f87171] text-[13px]">
              {serverError}
            </div>
          )}
        </div>

        {/* Results */}
        {serverResult && (
          <div className="flex flex-col gap-2.5">
            <div className={`border rounded-[14px] p-6 text-center ${savingsPositive ? "bg-emerald-400/7 border-emerald-400/20" : "bg-red-400/7 border-red-400/20"}`}>
              <p className="text-sm font-bold tracking-[1.5px] text-surface-950/35 m-0 mb-2.5">PREDICTED SAVINGS · EV VS PETROL</p>
              <p className={`text-[48px] font-extrabold m-0 mb-1.5 ${savingsPositive ? "text-emerald-400" : "text-[#f87171]"}`}>
                {savingsPositive ? "+" : "-"}${Math.abs(savings).toFixed(2)}
              </p>
              <span className={`text-xs px-3.5 py-1 rounded-[20px] border inline-block ${savingsPositive ? "bg-emerald-400/15 text-emerald-400 border-emerald-400/30" : "bg-red-400/15 text-[#f87171] border-red-400/30"}`}>
                {savingsPositive ? "EV is cheaper for this trip" : "Petrol is cheaper for this trip"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "EV trip cost", value: `$${serverResult.ev_trip_cost?.toFixed(2) ?? "—"}`, color: "#00b482", pct: 40, icon: "⚡" },
                { label: "Petrol trip cost", value: `$${serverResult.ice_trip_cost?.toFixed(2) ?? "—"}`, color: "#f87171", pct: 70, icon: "⛽" },
                { label: "CO₂ saved", value: `${serverResult.co2_saved_kg?.toFixed(2) ?? "—"} kg`, color: "#34d399", pct: 60, icon: "🌿" },
              ].map(({ label, value, color, pct, icon }) => (
                <div key={label} className="bento-card text-center" style={{ borderTop: `2px solid ${color}` }}>
                  <p className="text-[10px] font-bold tracking-[1.5px] text-surface-950/35 m-0 mb-2 uppercase">
                    {label}
                  </p>
                  <Ring pct={pct} color={color} size={56} key={label + ticker}>
                    <span className="text-xs">{icon}</span>
                  </Ring>
                  <p style={{ color }} className="text-base font-bold mt-2 mb-0">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "EV emissions", value: `${serverResult.ev_co2_kg?.toFixed(2) ?? "—"} kg`, color: "#00b482", pct: 30 },
                { label: "ICE emissions", value: `${serverResult.ice_co2_kg?.toFixed(2) ?? "—"} kg`, color: "#f87171", pct: 80 },
              ].map(({ label, value, color, pct }) => (
                <div key={label} className="bento-card">
                  <p className="text-sm font-bold tracking-[1.5px] text-surface-950/35 m-0 mb-2 uppercase">
                    {label}
                  </p>
                  <p style={{ color }} className="text-xl font-bold m-0 mb-2">{value}</p>
                  <div className="h-1 bg-white/8 rounded-[2px] overflow-hidden">
                    <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-xs transition-[width] duration-[1400ms] ease-out" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/2 border border-white/6 rounded-lg">
              <PulseDot color="#60a5fa" />
              <span className="text-sm text-surface-950/30">ML model: {serverResult.model_version}</span>
            </div>
          </div>
        )}
      </div>

      {chartData && <CostCharts chartData={chartData} />}

      {!serverResult && !loading && (
        <div className="text-center py-8 text-surface-950/15">
          <div className="text-6xl mb-12 opacity-50">⚡</div>
          <p className="text-base m-0 mb-2 text-surface-700">Select vehicles and enter trip details to compare costs</p>
          <p className="text-sm m-0 text-surface-600">Powered by LightGBM ML model</p>
        </div>
      )}
    </main>
  );
}