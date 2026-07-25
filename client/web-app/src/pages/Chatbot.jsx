import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user";

const CHATBOT_URL = "https://evat-rasa-rajs2z2qwq-ts.a.run.app/webhooks/rest/webhook";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const getSessionId = () => {
  const s = localStorage.getItem("evat_chat_session");
  if (s) return s;
  const id = "evat-" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("evat_chat_session", id);
  return id;
};

const timestamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const GEMINI_SUGGESTIONS = [
  "How far can an EV travel on a full charge?",
  "What is the cheapest EV to own in Australia?",
  "How long does it take to charge an EV?",
  "What are the benefits of switching to an EV?",
];

// ── Sub-components ──────────────────────────────────────────

function Avatar({ type }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
      background: type === "bot" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#e8e8f0",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px"
    }}>
      {type === "bot" ? "⚡" : "🙂"}
    </div>
  );
}

function Bubble({ sender, children, time }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px", flexDirection: sender === "user" ? "row-reverse" : "row" }}>
      <Avatar type={sender} />
      <div style={{
        maxWidth: "72%",
        background: sender === "user" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#fff",
        color: sender === "user" ? "#fff" : "#1a1a2e",
        borderRadius: sender === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
        padding: "10px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: sender === "bot" ? "1px solid #eee" : "none",
        fontSize: "14px", lineHeight: "1.6",
      }}>
        {children}
        <div style={{ fontSize: "10px", color: sender === "user" ? "rgba(255,255,255,0.6)" : "#bbb", marginTop: "4px", textAlign: "right" }}>{time}</div>
      </div>
    </div>
  );
}

function StationCard({ station, showAvailability, onGetDirections }) {
  const avail = (() => {
    const v = (station.availability || "").toString().toLowerCase();
    if (v === "yes" || v === "available") return { text: "Available", color: "#10b981", bg: "#d1fae5" };
    if (v === "no" || v === "busy") return { text: "Busy", color: "#ef4444", bg: "#fee2e2" };
    return { text: "Unknown", color: "#6b7280", bg: "#f3f4f6" };
  })();

  const fmtDist = (km) => km == null ? "—" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

  return (
    <div style={{ background: "#f8f9fc", border: "1px solid #e8e8f0", borderRadius: "12px", padding: "14px", marginBottom: "10px", display: "flex", gap: "12px" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>⚡</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 2px 0", color: "#1a1a2e" }}>{station.name || "Unnamed station"}</p>
            <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{station.address || ""}</p>
          </div>
          {showAvailability && (
            <span style={{ fontSize: "11px", fontWeight: 600, backgroundColor: avail.bg, color: avail.color, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>{avail.text}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
          {[
            { label: "Distance", value: fmtDist(station.distance_km) },
            { label: "Cost", value: station.cost || "—", emphasize: true },
            { label: "Power", value: station.power != null ? `${station.power} kW` : "—" },
          ].map(({ label, value, emphasize }) => (
            <div key={label}>
              <p style={{ fontSize: "10px", color: "#999", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
              <p style={{ fontSize: "13px", fontWeight: emphasize ? 700 : 500, color: emphasize ? "#6366f1" : "#1a1a2e", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
        <button onClick={() => onGetDirections(station.station_id)}
          style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
          Get Directions
        </button>
      </div>
    </div>
  );
}

function DirectionsCard({ payload }) {
  return (
    <div style={{ background: "#f8f9fc", border: "1px solid #e8e8f0", borderRadius: "12px", padding: "14px" }}>
      <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 6px 0" }}>🗺️ Directions</p>
      <p style={{ fontSize: "13px", color: "#555", margin: "0 0 4px 0" }}>{payload.origin} → {payload.destination}</p>
      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 10px 0" }}>
        Distance: {payload.distance_km != null ? payload.distance_km.toFixed(1) + " km" : "—"} &nbsp;|&nbsp;
        ETA: {payload.eta_min != null ? Math.round(payload.eta_min) + " min" : "—"}
        {payload.delay_min ? ` (+${Math.round(payload.delay_min)} min traffic)` : ""}
      </p>
      {payload.maps_url && (
        <div style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "8px" }}>
          <iframe src={`${payload.maps_url}&output=embed`} width="100%" height="200" style={{ border: 0, display: "block" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="directions" />
          <a href={payload.maps_url} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", marginTop: "8px", color: "#6366f1", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            Open in Google Maps →
          </a>
        </div>
      )}
      {Array.isArray(payload.instructions) && payload.instructions.length > 0 && (
        <ol style={{ margin: "8px 0 0 18px", fontSize: "12px", color: "#555", lineHeight: "1.6" }}>
          {payload.instructions.slice(0, 8).map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
    </div>
  );
}

function TrafficCard({ payload }) {
  return (
    <div style={{ background: "#f8f9fc", border: "1px solid #e8e8f0", borderRadius: "12px", padding: "14px" }}>
      <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 6px 0" }}>🚦 Traffic</p>
      <p style={{ fontSize: "13px", color: "#555", margin: "0 0 4px 0" }}>{payload.origin} → {payload.destination}</p>
      <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
        Status: {payload.status || "Available"}
        {payload.congestion_level != null ? ` | Level ${payload.congestion_level}` : ""}
        {payload.current_speed_kmh != null ? ` | Speed: ${Math.round(payload.current_speed_kmh)} km/h` : ""}
        {payload.delay_min != null ? ` | Delay: ${Math.round(payload.delay_min)} min` : ""}
      </p>
    </div>
  );
}

function Chips({ options, onSelect }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onSelect(opt)}
          style={{ background: "#fff", border: "1.5px solid #6366f1", borderRadius: "20px", color: "#6366f1", fontSize: "13px", fontWeight: 600, padding: "7px 18px", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6366f1"; }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

export default function Chatbot() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const firstName = user?.firstName || "there";

  const [activeTab, setActiveTab] = useState("station");
  const [showHistory, setShowHistory] = useState(false);

  // Messages — each: { id, type, sender, text, payload, chips, time }
  const [rasaMessages, setRasaMessages] = useState([]);
  const [rasaInput, setRasaInput] = useState("");
  const [rasaLoading, setRasaLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const [geminiMessages, setGeminiMessages] = useState([]);
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("evat_chat_history") || "[]"); } catch { return []; }
  });

  const [location, setLocation] = useState(null);
  const rasaBottomRef = useRef(null);
  const geminiBottomRef = useRef(null);
  const rasaInputRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => { rasaBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [rasaMessages, rasaLoading]);
  useEffect(() => { geminiBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [geminiMessages, geminiLoading]);
  useEffect(() => { localStorage.setItem("evat_chat_history", JSON.stringify(history)); }, [history]);

  const addRasaMessage = (msg) => {
    setRasaMessages(prev => [...prev, { id: Date.now() + Math.random(), time: timestamp(), ...msg }]);
  };

  const sendToRasa = async (text) => {
    setRasaLoading(true);
    try {
      const res = await fetch(CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: getSessionId(),
          message: text,
          metadata: location || {},
        }),
      });
      const data = await res.json();
      handleRasaResponse(data || []);
    } catch {
      addRasaMessage({ type: "text", sender: "bot", text: "Server error. Please try again." });
    } finally {
      setRasaLoading(false);
    }
  };

  const handleRasaResponse = (messages) => {
    messages.forEach((msg, i) => {
      setTimeout(() => {
        // Text message
        if (msg.text) {
          const clean = msg.text.replace(/\*\*(.*?)\*\*/g, "$1");
          const needsNumberChips = /press|type/i.test(clean) && /1.*2.*3|1, 2, or 3/i.test(clean);
          const needsFcpChips = /fastest|cheapest|premium/i.test(clean) && !/1.*2.*3/.test(clean);

          addRasaMessage({ type: "text", sender: "bot", text: clean });

          if (needsNumberChips) {
            setTimeout(() => addRasaMessage({ type: "chips", sender: "bot", chips: ["1", "2", "3"] }), 200);
          }
          if (needsFcpChips) {
            setTimeout(() => addRasaMessage({ type: "chips", sender: "bot", chips: ["Cheapest", "Fastest", "Premium"] }), 200);
          }
          // Rasa buttons
          if (msg.buttons?.length) {
            setTimeout(() => addRasaMessage({ type: "chips", sender: "bot", chips: msg.buttons.map(b => b.title), payloads: msg.buttons.map(b => b.payload) }), 200);
          }
        }

        // Custom payload
        const payload = msg.custom || msg.json_message || null;
        if (payload && typeof payload === "object") {
          if (payload.type === "directions") {
            addRasaMessage({ type: "directions", sender: "bot", payload });
          } else if (payload.type === "traffic") {
            addRasaMessage({ type: "traffic", sender: "bot", payload });
          } else if (Array.isArray(payload.stations)) {
            addRasaMessage({ type: "stations", sender: "bot", payload });
          }
        }
      }, i * 350);
    });

    // Update history
    setHistory(prev => {
      const existing = prev.find(h => h.active && h.tab === "station");
      if (existing) return prev.map(h => h.active && h.tab === "station" ? { ...h, date: new Date().toISOString() } : h);
      return [{ id: Date.now(), title: "Station Chat", tab: "station", date: new Date().toISOString(), active: true }, ...prev.slice(0, 19)];
    });
  };

  const handleRasaStart = async () => {
    setStarted(true);
    addRasaMessage({ type: "text", sender: "user", text: "hello" });
    await sendToRasa("hello");
  };

  const handleRasaSubmit = async () => {
    if (!rasaInput.trim() || rasaLoading) return;
    const msg = rasaInput.trim();
    setRasaInput("");
    addRasaMessage({ type: "text", sender: "user", text: msg });
    await sendToRasa(msg);
  };

  const handleChipClick = async (chip, payloads, index) => {
    const payload = payloads?.[index] || chip;
    addRasaMessage({ type: "text", sender: "user", text: chip });
    await sendToRasa(payload);
  };

  const handleGetDirections = async (stationId) => {
    addRasaMessage({ type: "text", sender: "user", text: "Get Directions" });
    await sendToRasa(`/get_directions{"station_id":"${stationId}"}`);
  };

  // Gemini
  const handleGeminiSend = async (text) => {
    const msg = (text || geminiInput).trim();
    if (!msg || geminiLoading) return;
    setGeminiInput("");
    setGeminiMessages(prev => [...prev, { from: "user", text: msg, time: timestamp() }]);
    setGeminiLoading(true);
    try {
      if (!GEMINI_API_KEY) {
        setTimeout(() => {
          setGeminiMessages(prev => [...prev, { from: "bot", text: "Add VITE_GEMINI_API_KEY to your .env to enable EVAT-AI.", time: timestamp() }]);
          setGeminiLoading(false);
        }, 400);
        return;
      }
      const ctx = geminiMessages.map(m => ({ role: m.from === "user" ? "user" : "model", parts: [{ text: m.text }] }));
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are EVAT-AI, an EV assistant for the EVAT platform in Australia. Answer questions about electric vehicles, charging, range, costs, and sustainability. Keep answers concise and helpful." }] },
          contents: [...ctx, { role: "user", parts: [{ text: msg }] }]
        }),
      });
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
      setGeminiMessages(prev => [...prev, { from: "bot", text: reply, time: timestamp() }]);
      setHistory(prev => [{ id: Date.now(), title: msg.slice(0, 40), tab: "ai", date: new Date().toISOString() }, ...prev.slice(0, 19)]);
    } catch {
      setGeminiMessages(prev => [...prev, { from: "bot", text: "Something went wrong. Please try again.", time: timestamp() }]);
    } finally { setGeminiLoading(false); }
  };

  const renderRasaMessage = (msg) => {
    if (msg.type === "text") {
      return (
        <Bubble key={msg.id} sender={msg.sender} time={msg.time}>
          <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
        </Bubble>
      );
    }
    if (msg.type === "chips") {
      return (
        <div key={msg.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
          <Avatar type="bot" />
          <Chips options={msg.chips} onSelect={(chip) => {
            const idx = msg.chips.indexOf(chip);
            handleChipClick(chip, msg.payloads, idx);
          }} />
        </div>
      );
    }
    if (msg.type === "stations") {
      return (
        <div key={msg.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
          <Avatar type="bot" />
          <div style={{ flex: 1, maxWidth: "72%" }}>
            {msg.payload.stations.map((s, i) => (
              <StationCard key={i} station={s} showAvailability={!!msg.payload.show_availability} onGetDirections={handleGetDirections} />
            ))}
            <div style={{ fontSize: "10px", color: "#bbb", textAlign: "right", marginTop: "4px" }}>{msg.time}</div>
          </div>
        </div>
      );
    }
    if (msg.type === "directions") {
      return (
        <div key={msg.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
          <Avatar type="bot" />
          <div style={{ flex: 1, maxWidth: "72%" }}>
            <DirectionsCard payload={msg.payload} />
            <div style={{ fontSize: "10px", color: "#bbb", textAlign: "right", marginTop: "4px" }}>{msg.time}</div>
          </div>
        </div>
      );
    }
    if (msg.type === "traffic") {
      return (
        <div key={msg.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
          <Avatar type="bot" />
          <div style={{ flex: 1, maxWidth: "72%" }}>
            <TrafficCard payload={msg.payload} />
            <div style={{ fontSize: "10px", color: "#bbb", textAlign: "right", marginTop: "4px" }}>{msg.time}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f8f9fc", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        .msg-anim { animation: fadeUp 0.2s ease forwards; }
        .dot { width:7px;height:7px;border-radius:50%;background:#6366f1;display:inline-block;animation:typingDot 1.2s infinite; }
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        .side-btn { width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;transition:all 0.2s;border:none;background:transparent; }
        .side-btn:hover { background:#f0f0f5; }
        .side-btn.active { background:#ede9fe; }
        .hist-item:hover { background:#f5f5fa; border-radius:10px; }
        .tab-btn { padding:8px 18px;border-radius:10px;border:none;background:transparent;color:#888;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s; }
        .tab-btn.active { background:#fff;color:#1a1a2e;box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .input-bar { background:#fff;border:1.5px solid #e8e8f0;border-radius:14px;display:flex;align-items:center;padding:6px 6px 6px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);transition:border-color 0.2s; }
        .input-bar:focus-within { border-color:#6366f1;box-shadow:0 4px 20px rgba(99,102,241,0.12); }
        .send-btn:hover:not(:disabled) { transform:scale(1.05); }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
      `}</style>

      {/* Sidebar icons */}
      <div style={{ width: "64px", background: "#fff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: "8px" }}>
        <button className="side-btn" onClick={() => navigate("/use-cases")} title="Back">←</button>
        <div style={{ width: "32px", height: "1px", background: "#eee", margin: "4px 0" }} />
        <button className={`side-btn ${!showHistory ? "active" : ""}`} onClick={() => setShowHistory(false)} title="Home">🏠</button>
        <button className={`side-btn ${showHistory ? "active" : ""}`} onClick={() => setShowHistory(s => !s)} title="History">🕐</button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div key={history.length} style={{ width: "230px", background: "#fff", borderRight: "1px solid #eee", padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ color: "#999", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>Recent Chats</p>
            <button onClick={() => {
              setStarted(false); setRasaMessages([]); setGeminiMessages([]);
              localStorage.removeItem("evat_chat_session");
              setHistory(prev => prev.map(h => ({ ...h, active: false })));
            }} style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>+ New</button>
          </div>
          {history.length === 0 ? (
            <p style={{ color: "#ccc", fontSize: "12px", textAlign: "center", marginTop: "40px" }}>No history yet</p>
          ) : history.map(h => (
            <div key={h.id} className="hist-item" style={{ padding: "10px", marginBottom: "4px", cursor: "pointer", background: h.active ? "#f0f0ff" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span style={{ fontSize: "10px", backgroundColor: h.tab === "ai" ? "#ede9fe" : "#e0f2fe", color: h.tab === "ai" ? "#6366f1" : "#0284c7", padding: "1px 7px", borderRadius: "4px", fontWeight: 600 }}>{h.tab === "ai" ? "AI" : "Station"}</span>
                {h.active && <span style={{ fontSize: "9px", color: "#10b981", fontWeight: 600 }}>LIVE</span>}
              </div>
              <p style={{ color: "#333", fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</p>
              <p style={{ color: "#bbb", fontSize: "10px", margin: "2px 0 0 0" }}>{new Date(h.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "14px 28px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#999" }}>EV Assistant</span>
            <span style={{ color: "#ddd" }}>·</span>
            <span style={{ fontSize: "11px", color: "#bbb" }}>Rasa & EVAT-AI</span>
          </div>
          <div style={{ background: "#f5f5fa", borderRadius: "12px", padding: "4px", display: "flex", gap: "2px" }}>
            <button className={`tab-btn ${activeTab === "station" ? "active" : ""}`} onClick={() => setActiveTab("station")}>⚡ Station Assistant</button>
            <button className={`tab-btn ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}>✨ EVAT-AI</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: location ? "#10b981" : "#f87171", display: "inline-block" }} />
            <span style={{ color: "#bbb", fontSize: "11px" }}>{location ? "GPS on" : "GPS off"}</span>
          </div>
        </div>

        {/* ── STATION TAB ── */}
        {activeTab === "station" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ maxWidth: "720px", margin: "0 auto" }}>

                {/* Landing */}
                {!started && (
                  <div style={{ textAlign: "center", paddingTop: "40px" }}>
                    <div style={{ fontSize: "64px", marginBottom: "16px" }}>⚡</div>
                    <h2 style={{ color: "#1a1a2e", fontSize: "28px", fontWeight: 800, margin: "0 0 8px 0" }}>
                      Hi {firstName}, <span style={{ color: "#6366f1" }}>Find a Charger</span>
                    </h2>
                    <p style={{ color: "#999", fontSize: "14px", margin: "0 0 32px 0" }}>
                      {location ? "📍 GPS location detected — station search enabled" : "📍 Enable location for nearby station search"}
                    </p>
                    <button onClick={handleRasaStart}
                      style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "12px", padding: "13px 36px", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 6px 20px rgba(99,102,241,0.3)" }}>
                      Start Chat →
                    </button>
                  </div>
                )}

                {/* Messages */}
                <div className="msg-anim">
                  {rasaMessages.map(msg => renderRasaMessage(msg))}
                </div>

                {/* Typing */}
                {rasaLoading && (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                    <Avatar type="bot" />
                    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "4px 18px 18px 18px", padding: "12px 16px", display: "flex", gap: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <span className="dot" /><span className="dot" /><span className="dot" />
                    </div>
                  </div>
                )}
                <div ref={rasaBottomRef} />
              </div>
            </div>

            {/* Input — always visible */}
            <div style={{ padding: "12px 28px 20px", background: "#f8f9fc", borderTop: "1px solid #eee" }}>
              <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                <div className="input-bar">
                  <input ref={rasaInputRef} type="text" value={rasaInput}
                    onChange={(e) => setRasaInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRasaSubmit()}
                    placeholder={started ? "Type a message..." : "Click Start Chat to begin"}
                    disabled={!started}
                    style={{ flex: 1, background: "none", border: "none", color: "#1a1a2e", fontSize: "14px", outline: "none", padding: "8px 0" }}
                  />
                  <button className="send-btn" onClick={handleRasaSubmit} disabled={rasaLoading || !rasaInput.trim() || !started}
                    style={{ background: rasaLoading || !rasaInput.trim() || !started ? "#ddd" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: rasaLoading || !rasaInput.trim() || !started ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
                <p style={{ color: "#bbb", fontSize: "11px", textAlign: "center", marginTop: "6px" }}>Powered by Rasa · {location ? "GPS enabled" : "Enable GPS for nearby stations"}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── AI TAB ── */}
        {activeTab === "ai" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                {geminiMessages.length === 0 && (
                  <div style={{ textAlign: "center", paddingTop: "40px", marginBottom: "32px" }}>
                    <div style={{ fontSize: "64px", marginBottom: "16px" }}>✨</div>
                    <h2 style={{ color: "#1a1a2e", fontSize: "28px", fontWeight: 800, margin: "0 0 8px 0" }}>
                      I am <span style={{ color: "#6366f1" }}>EVAT-AI</span>
                    </h2>
                    <p style={{ color: "#999", fontSize: "14px", margin: "0 0 32px 0" }}>Ask me anything about electric vehicles, charging, costs, and sustainability.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", textAlign: "left" }}>
                      {GEMINI_SUGGESTIONS.map(s => (
                        <div key={s} onClick={() => handleGeminiSend(s)}
                          style={{ background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "14px 16px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#eee"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}>
                          <p style={{ color: "#555", fontSize: "13px", margin: "0 0 6px 0", lineHeight: "1.4" }}>{s}</p>
                          <span style={{ color: "#6366f1", fontSize: "12px", fontWeight: 600 }}>Ask this →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {geminiMessages.map((msg, i) => (
                  <Bubble key={i} sender={msg.from} time={msg.time}>
                    {msg.from === "bot" ? (
                      <>
                        <p style={{ color: "#6366f1", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", margin: "0 0 6px 0" }}>EVAT-AI</p>
                        <span style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </>
                    ) : msg.text}
                  </Bubble>
                ))}

                {geminiLoading && (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                    <Avatar type="bot" />
                    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "4px 18px 18px 18px", padding: "12px 16px", display: "flex", gap: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <span className="dot" /><span className="dot" /><span className="dot" />
                    </div>
                  </div>
                )}
                <div ref={geminiBottomRef} />
              </div>
            </div>

            <div style={{ padding: "12px 28px 20px", background: "#f8f9fc", borderTop: "1px solid #eee" }}>
              <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                {!GEMINI_API_KEY && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 16px", marginBottom: "10px", textAlign: "center" }}>
                    <span style={{ color: "#92400e", fontSize: "12px" }}>⚠️ Add VITE_GEMINI_API_KEY to your .env to enable EVAT-AI</span>
                  </div>
                )}
                <div className="input-bar">
                  <span style={{ color: "#bbb", marginRight: "8px" }}>✨</span>
                  <input type="text" value={geminiInput}
                    onChange={(e) => setGeminiInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGeminiSend()}
                    placeholder='Ask anything about EVs...'
                    style={{ flex: 1, background: "none", border: "none", color: "#1a1a2e", fontSize: "14px", outline: "none", padding: "8px 0" }}
                  />
                  <button className="send-btn" onClick={() => handleGeminiSend()} disabled={geminiLoading || !geminiInput.trim()}
                    style={{ background: geminiLoading || !geminiInput.trim() ? "#ddd" : "linear-gradient(135deg,#6366f1,#10b981)", color: "#fff", border: "none", borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: geminiLoading || !geminiInput.trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
                <p style={{ color: "#bbb", fontSize: "11px", textAlign: "center", marginTop: "6px" }}>Powered by EVAT-AI · EV-focused assistant</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}