import React, { useState } from "react";
import { getTripConfidence } from "../services/tripConfidenceService";

const PulseDot = ({ color = "#00b482" }) => (
  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10, marginRight: 6 }}>
    <span style={{ position: "absolute", width: 10, height: 10, borderRadius: "50%", backgroundColor: color, opacity: 0.4, animation: "pingAnim 1.4s ease-in-out infinite" }} />
    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
  </span>
);

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

const FACTOR_META = {
  energy: { label: "Energy", icon: "\u26A1", color: "#00b482" },
  congestion: { label: "Congestion", icon: "\u25A4", color: "#60a5fa" },
  reliability: { label: "Reliability", icon: "\u2699", color: "#f59e0b" },
  cost: { label: "Cost", icon: "$", color: "#34d399" },
  environmental: { label: "Environmental", icon: "\u2637", color: "#4ade80" },
};

export default function TripConfidenceCard() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationPostcode, setDestinationPostcode] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [electricityCost, setElectricityCost] = useState("");
  const [petrolPrice, setPetrolPrice] = useState("");
  const [chargerId, setChargerId] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const tokenFull = localStorage.getItem("currentUser");
  const token = tokenFull ? JSON.parse(tokenFull).token : null;

  const validate = () => {
    const errs = {};
    if (!origin.trim()) errs.origin = "Please enter a starting point";
    if (!destination.trim()) errs.destination = "Please enter a destination";
    if (!destinationPostcode.trim()) errs.destinationPostcode = "Please enter the destination postcode";
    if (!tripDate) errs.tripDate = "Please select a trip date";
    if (!distanceKm.trim() || Number(distanceKm) <= 0) errs.distanceKm = "Please enter trip distance";
    if (!electricityCost.trim() || Number(electricityCost) <= 0) errs.electricityCost = "Please enter electricity rate";
    if (!petrolPrice.trim() || Number(petrolPrice) <= 0) errs.petrolPrice = "Please enter petrol price";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setServerError("");
    setResult(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        origin,
        destination,
        destination_postcode: destinationPostcode,
        trip_date: tripDate,
        distance_km: parseFloat(distanceKm),
        electricity_price_per_kwh: parseFloat(electricityCost),
        petrol_price_per_l: parseFloat(petrolPrice),
        charger_id: chargerId || undefined,
      };
      const response = await getTripConfidence(payload, token);
      setResult(response);
    } catch (err) {
      setServerError(err.message || "Error contacting trip confidence service");
    } finally {
      setLoading(false);
    }
  };

  const score = result?.confidence_score ?? 0;
  const scoreColor = score >= 70 ? "#34d399" : score >= 40 ? "#f59e0b" : "#f87171";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080f0a", fontFamily: "'Segoe UI', sans-serif", padding: "40px 24px" }}>
      <style>{`
        @keyframes pingAnim { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(2.2);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .bento-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px; animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .bento-card:nth-child(1){animation-delay:.05s}.bento-card:nth-child(2){animation-delay:.1s}.bento-card:nth-child(3){animation-delay:.15s}.bento-card:nth-child(4){animation-delay:.2s}.bento-card:nth-child(5){animation-delay:.25s}
        .card-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: rgba(255,255,255,0.35); margin: 0 0 8px 0; text-transform: uppercase; }
        .field-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.5px; display: block; margin-bottom: 6px; margin-top: 14px; }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "rgba(0,180,130,0.12)", border: "1px solid rgba(0,180,130,0.25)", borderRadius: "20px", padding: "4px 14px", marginBottom: "14px" }}>
            <PulseDot />
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", color: "#00b482" }}>TRIP CONFIDENCE SCORE</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0" }}>How confident should you be <span style={{ color: "#00b482" }}>about this trip?</span></h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>Combines energy, congestion, charger reliability, cost, and environmental impact into one score.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: "16px" }}>

          {/* Form */}
          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="field-label" style={{ marginTop: 0 }}>Origin</label>
                <input style={inputStyle} value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Melbourne CBD" />
                {formErrors.origin && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.origin}</span>}
              </div>
              <div>
                <label className="field-label" style={{ marginTop: 0 }}>Destination</label>
                <input style={inputStyle} value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Geelong" />
                {formErrors.destination && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.destination}</span>}
              </div>
              <div>
                <label className="field-label">Destination postcode</label>
                <input style={inputStyle} value={destinationPostcode} onChange={e => setDestinationPostcode(e.target.value)} placeholder="e.g. 3220" />
                {formErrors.destinationPostcode && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.destinationPostcode}</span>}
              </div>
              <div>
                <label className="field-label">Trip date</label>
                <input style={inputStyle} type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} />
                {formErrors.tripDate && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.tripDate}</span>}
              </div>
              <div>
                <label className="field-label">Distance (km)</label>
                <input style={inputStyle} type="number" min="1" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} placeholder="e.g. 75" />
                {formErrors.distanceKm && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.distanceKm}</span>}
              </div>
              <div>
                <label className="field-label">Charger ID <span style={{ color: "rgba(255,255,255,0.3)" }}>(optional)</span></label>
                <input style={inputStyle} value={chargerId} onChange={e => setChargerId(e.target.value)} placeholder="e.g. MEL069" />
              </div>
              <div>
                <label className="field-label">Electricity ($/kWh)</label>
                <input style={inputStyle} type="number" min="0.01" step="0.01" value={electricityCost} onChange={e => setElectricityCost(e.target.value)} placeholder="e.g. 0.30" />
                {formErrors.electricityCost && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.electricityCost}</span>}
              </div>
              <div>
                <label className="field-label">Petrol ($/L)</label>
                <input style={inputStyle} type="number" min="0.01" step="0.01" value={petrolPrice} onChange={e => setPetrolPrice(e.target.value)} placeholder="e.g. 1.85" />
                {formErrors.petrolPrice && <span style={{ color: "#f87171", fontSize: "11px" }}>{formErrors.petrolPrice}</span>}
              </div>
            </div>

            <button onClick={handleCheck} disabled={loading}
              style={{ marginTop: "20px", backgroundColor: loading ? "rgba(0,180,130,0.3)" : "#00b482", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 28px", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {loading ? (<><PulseDot color="#fff" />Checking...</>) : "Check trip confidence \u2192"}
            </button>

            {serverError && (
              <div style={{ marginTop: "12px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "12px 16px", color: "#f87171", fontSize: "13px" }}>
                {serverError}
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${scoreColor}33`, borderRadius: "14px", padding: "24px", textAlign: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.35)", margin: "0 0 10px 0" }}>TRIP CONFIDENCE</p>
                <p style={{ fontSize: "48px", fontWeight: 800, color: scoreColor, margin: "0 0 6px 0" }}>{score.toFixed(0)}%</p>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{result.summary}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {result.factors.map((factor) => {
                  const meta = FACTOR_META[factor.name] || { label: factor.name, icon: "\u2022", color: "#8DA9C4" };
                  return (
                    <div key={factor.name} className="bento-card" style={{ borderTop: `2px solid ${factor.available ? meta.color : "rgba(255,255,255,0.15)"}`, opacity: factor.available ? 1 : 0.6 }}>
                      <p className="card-label">{meta.icon} {meta.label}</p>
                      {factor.available ? (
                        <p style={{ color: meta.color, fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0" }}>{(factor.value * 100).toFixed(0)}%</p>
                      ) : (
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", fontWeight: 600, margin: "0 0 6px 0" }}>Unavailable</p>
                      )}
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>{factor.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px", opacity: 0.5 }}>\u26A1</div>
            <p style={{ fontSize: "16px", margin: "0 0 8px 0", color: "rgba(255,255,255,0.3)" }}>Enter your trip details to see how confident you should be</p>
          </div>
        )}
      </div>
    </div>
  );
}