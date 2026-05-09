import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user";

const CHATBOT_URL = "https://evat-rasa-3cn2oy3gna-ts.a.run.app/webhooks/rest/webhook";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const getSessionId = () => {
  const s = localStorage.getItem("evat_chat_session");
  if (s) return s;
  const id = "evat-" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("evat_chat_session", id);
  return id;
};

const FLOWS = [
  { id: "route", icon: "🗺️", title: "Route Planning", desc: "Plan charging stops along your journey. Enter your destination and find stations on the way.", payload: "1", color: "#6366f1" },
  { id: "emergency", icon: "⚡", title: "Emergency Charging", desc: "Find the nearest charger fast when your battery is running low.", payload: "2", color: "#f59e0b" },
  { id: "preferences", icon: "⚙️", title: "Charging Preferences", desc: "Find stations filtered by cheapest, fastest, or premium options.", payload: "3", color: "#10b981" },
];

const CONNECTORS = ["Tesla Model 3", "Tesla Model Y", "Type 2", "CCS", "CHAdeMO", "AC Type 1"];
const PREFERENCES = [
  { label: "Cheapest", icon: "💵", desc: "Lowest cost per kWh" },
  { label: "Fastest", icon: "⚡", desc: "Highest power output" },
  { label: "Premium", icon: "⭐", desc: "Top rated stations" },
];
const POST_STATION = [
  { label: "Get Directions", payload: "get directions", icon: "🧭" },
  { label: "Check Availability", payload: "check availability", icon: "🔍" },
  { label: "End Chat", payload: "bye", icon: "👋" },
];
const GEMINI_SUGGESTIONS = [
  "How far can an EV travel on a full charge?",
  "What is the cheapest EV to own in Australia?",
  "How long does it take to charge an EV?",
  "What are the benefits of switching to an EV?",
];

export default function Chatbot() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const firstName = user?.firstName || "there";

  const [activeTab, setActiveTab] = useState("station");
  const [showHistory, setShowHistory] = useState(false);

  const [rasaMessages, setRasaMessages] = useState([]);
  const [rasaStarted, setRasaStarted] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);
  const [awaitingInput, setAwaitingInput] = useState(null);
  const [showPostStation, setShowPostStation] = useState(false);
  const [rasaInput, setRasaInput] = useState("");
  const [rasaLoading, setRasaLoading] = useState(false);

  const [geminiMessages, setGeminiMessages] = useState([]);
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("evat_chat_history") || "[]"); } catch { return []; }
  });

  const [location, setLocation] = useState(null);
  const rasaBottomRef = useRef(null);
  const geminiBottomRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => { rasaBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [rasaMessages, rasaLoading]);
  useEffect(() => { geminiBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [geminiMessages, geminiLoading]);
  useEffect(() => { localStorage.setItem("evat_chat_history", JSON.stringify(history)); }, [history]);

  const sendToRasa = async (msg) => {
    setRasaLoading(true);
    try {
      const res = await fetch(CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: getSessionId(),
          message: msg,
          ...(location && { metadata: { latitude: location.latitude, longitude: location.longitude } })
        }),
      });
      return await res.json() || [];
    } catch { return []; }
    finally { setRasaLoading(false); }
  };

  const addRasaBot = (responses, showPost = false) => {
    if (!responses.length) {
      setRasaMessages(prev => [...prev, { from: "bot", text: "Sorry, I couldn't get a response.", buttons: [] }]);
      return;
    }
    responses.forEach((r, i) => {
      setTimeout(() => {
        setRasaMessages(prev => {
          const updated = [...prev, { from: "bot", text: r.text, buttons: r.buttons || [] }];
          // Update history with latest messages
          setHistory(hist => {
            const existing = hist.find(h => h.tab === "station" && h.active);
            if (existing) return hist.map(h => h.active && h.tab === "station" ? { ...h, messages: updated, date: new Date().toISOString() } : h);
            return [{ id: Date.now(), title: updated.find(m => m.from === "user")?.text?.slice(0, 40) || "Station Chat", tab: "station", messages: updated, date: new Date().toISOString(), active: true }, ...hist.slice(0, 19)];
          });
          return updated;
        });
        if (i === responses.length - 1 && showPost) setShowPostStation(true);
      }, i * 300);
    });
  };

  const handleRasaStart = async () => {
    setRasaStarted(true);
    setRasaMessages([{ from: "user", text: "hi" }]);
    const r = await sendToRasa("hi");
    addRasaBot(r);
  };

  const handleFlowSelect = async (flow) => {
    setActiveFlow(flow.id);
    setShowPostStation(false);
    setRasaMessages(prev => [...prev, { from: "user", text: flow.title }]);
    const r = await sendToRasa(flow.payload);
    if (flow.id === "route") setAwaitingInput("route_destination");
    else if (flow.id === "emergency") setAwaitingInput("emergency_location");
    else if (flow.id === "preferences") setAwaitingInput(null);
    addRasaBot(r);
  };

  const handleConnectorSelect = async (c) => {
    setRasaMessages(prev => [...prev, { from: "user", text: c }]);
    setAwaitingInput("station_select");
    const r = await sendToRasa(c);
    addRasaBot(r, true);
  };

  const handlePreferenceSelect = async (p) => {
    setRasaMessages(prev => [...prev, { from: "user", text: p.label }]);
    setAwaitingInput("preference_location");
    const r = await sendToRasa(p.label);
    addRasaBot(r);
  };

  const handlePostStation = async (action) => {
    setShowPostStation(false);
    if (action.payload === "bye") {
      setHistory(prev => [{ id: Date.now(), title: rasaMessages[1]?.text || "Station Chat", tab: "station", date: new Date().toISOString() }, ...prev]);
      setRasaStarted(false); setActiveFlow(null); setAwaitingInput(null); setRasaMessages([]);
      localStorage.removeItem("evat_chat_session");
      return;
    }
    setRasaMessages(prev => [...prev, { from: "user", text: action.label }]);
    const r = await sendToRasa(action.payload);
    addRasaBot(r, true);
  };

  const handleRasaTextSubmit = async () => {
    if (!rasaInput.trim() || rasaLoading) return;
    const msg = rasaInput.trim();
    setRasaInput("");
    setRasaMessages(prev => [...prev, { from: "user", text: msg }]);
    const r = await sendToRasa(msg);
    if (awaitingInput === "route_destination") { setAwaitingInput("station_select"); addRasaBot(r, true); }
    else if (awaitingInput === "emergency_location") { setAwaitingInput("connector_select"); addRasaBot(r); }
    else if (awaitingInput === "preference_location") { setAwaitingInput("station_select"); addRasaBot(r, true); }
    else if (awaitingInput === "station_select") { setAwaitingInput(null); addRasaBot(r, true); }
    else addRasaBot(r);
  };

  const handleGeminiSend = async (text) => {
    const msg = (text || geminiInput).trim();
    if (!msg || geminiLoading) return;
    setGeminiInput("");
    setGeminiMessages(prev => [...prev, { from: "user", text: msg }]);
    setGeminiLoading(true);
    try {
      if (!GEMINI_API_KEY) {
        setTimeout(() => {
          setGeminiMessages(prev => [...prev, { from: "bot", text: "Gemini API key not configured yet. Add VITE_GEMINI_API_KEY to your .env file." }]);
          setGeminiLoading(false);
        }, 500);
        return;
      }
      const ctx = geminiMessages.map(m => ({ role: m.from === "user" ? "user" : "model", parts: [{ text: m.text }] }));
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are an EV assistant for the EVAT platform in Australia. Answer questions about electric vehicles, charging, range, costs, and sustainability. Keep answers concise and helpful." }] },
          contents: [...ctx, { role: "user", parts: [{ text: msg }] }]
        }),
      });
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
      setGeminiMessages(prev => [...prev, { from: "bot", text: reply }]);
      setHistory(prev => [{ id: Date.now(), title: msg.slice(0, 40), tab: "ai", date: new Date().toISOString() }, ...prev.slice(0, 19)]);
    } catch {
      setGeminiMessages(prev => [...prev, { from: "bot", text: "Something went wrong. Please try again." }]);
    } finally { setGeminiLoading(false); }
  };

  const renderText = (text) => text
    ?.replace(/[\u{1F4CD}\u{26A1}\u{1F4B0}\u{1F3AF}\u274C\u2705\u{1F4A1}\u{1F50C}\u{1F5FA}\u{1F697}\u{1F50B}]/gu, '')
    ?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    ?.replace(/\*(.*?)\*/g, '<em>$1</em>')
    ?.trim() || "";

  const rasaInputPlaceholder = {
    route_destination: "e.g. to Carlton or from Carlton to Geelong",
    emergency_location: "Enter your suburb e.g. Richmond",
    preference_location: "Enter your suburb e.g. Carlton",
    station_select: "Type the station name from the list above",
  }[awaitingInput] || "Type your message...";

  const showRasaTextInput = !!awaitingInput && awaitingInput !== "connector_select";
  const showConnectors = awaitingInput === "connector_select";
  const showPreferences = activeFlow === "preferences" && !awaitingInput && rasaStarted && rasaMessages.length > 1;
  const showFlows = rasaStarted && !activeFlow && rasaMessages.length > 0;

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f8f9fc", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes typingDot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        .msg { animation: fadeUp 0.25s ease forwards; }
        .dot { width:7px;height:7px;border-radius:50%;background:#6366f1;display:inline-block;animation:typingDot 1.2s infinite; }
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        .flow-card { transition:all 0.2s ease;cursor:pointer;background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #eee; }
        .flow-card:hover { transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.1); }
        .chip:hover { opacity:0.85;transform:scale(1.02); }
        .side-btn { width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;transition:all 0.2s;border:none;background:transparent; }
        .side-btn:hover { background:#f0f0f5; }
        .side-btn.active { background:#ede9fe; }
        .hist-item:hover { background:#f5f5fa; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
        .tab-btn { padding:8px 18px;border-radius:10px;border:none;background:transparent;color:#888;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s; }
        .tab-btn.active { background:#fff;color:#1a1a2e;box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .send-btn { transition:all 0.2s; }
        .send-btn:hover:not(:disabled) { transform:scale(1.05); }
        .input-bar { background:#fff;border:1.5px solid #e8e8f0;border-radius:16px;display:flex;align-items:center;padding:6px 6px 6px 18px;box-shadow:0 4px 16px rgba(0,0,0,0.06); }
        .input-bar:focus-within { border-color:#6366f1;box-shadow:0 4px 20px rgba(99,102,241,0.12); }
        .user-bubble { background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-radius:18px 18px 4px 18px;padding:10px 16px;font-size:14px;max-width:65%;line-height:1.5; }
        .bot-bubble { background:#fff;border:1px solid #eee;border-radius:4px 18px 18px 18px;padding:12px 16px;font-size:14px;color:#1a1a2e;line-height:1.7;box-shadow:0 2px 8px rgba(0,0,0,0.05); }
        .action-chip { background:#fff;border:1.5px solid #e0e0f0;border-radius:20px;color:#6366f1;font-size:13px;font-weight:600;padding:8px 18px;cursor:pointer;transition:all 0.2s; }
        .action-chip:hover { background:#ede9fe;border-color:#6366f1; }
      `}</style>

      {/* Left sidebar */}
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
              setRasaStarted(false); setActiveFlow(null); setAwaitingInput(null); setShowPostStation(false); setRasaMessages([]);
              setGeminiMessages([]);
              localStorage.removeItem("evat_chat_session");
              setHistory(prev => prev.map(h => ({ ...h, active: false })));
            }} style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>+ New</button>
          </div>
          {history.length === 0 ? (
            <p style={{ color: "#ccc", fontSize: "12px", textAlign: "center", marginTop: "40px" }}>No history yet</p>
          ) : history.map(h => (
            <div key={h.id} className="hist-item" style={{ padding: "10px", borderRadius: "10px", marginBottom: "4px", cursor: "pointer", background: h.active ? "#f0f0ff" : "transparent" }}>
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

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "14px 28px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#999" }}>EV Assistant</span>
            <span style={{ color: "#ddd" }}>·</span>
            <span style={{ fontSize: "11px", color: "#bbb" }}>Rasa & Gemini</span>
          </div>
          <div style={{ background: "#f5f5fa", borderRadius: "12px", padding: "4px", display: "flex", gap: "2px" }}>
            <button className={`tab-btn ${activeTab === "station" ? "active" : ""}`} onClick={() => setActiveTab("station")}>🗺️ Station Assistant</button>
            <button className={`tab-btn ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}>✨ Ask AI</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: location ? "#10b981" : "#f87171", display: "inline-block" }} />
            <span style={{ color: "#bbb", fontSize: "11px" }}>{location ? "GPS on" : "GPS off"}</span>
          </div>
        </div>

        {/* ── STATION TAB ── */}
        {activeTab === "station" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
              <div style={{ maxWidth: "760px", margin: "0 auto" }}>

                {/* Landing */}
                {!rasaStarted && (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                      <div>
                        <h1 style={{ fontSize: "38px", fontWeight: 800, margin: "0 0 10px 0", color: "#1a1a2e", lineHeight: 1.2 }}>
                          Hi {firstName}, <span style={{ color: "#888", fontWeight: 400 }}>Ready to</span><br />
                          <span style={{ color: "#6366f1" }}>Find a Charger?</span>
                        </h1>
                        <p style={{ color: "#999", fontSize: "14px", margin: "0 0 24px 0" }}>Select a flow below to get started. Your GPS location is used automatically.</p>
                        <button onClick={handleRasaStart}
                          style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "12px", padding: "12px 28px", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 6px 20px rgba(99,102,241,0.3)" }}>
                          Start Session →
                        </button>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#bbb", fontSize: "13px", margin: "0 0 4px 0" }}>Hey there 👋</p>
                        <h2 style={{ color: "#1a1a2e", fontSize: "28px", fontWeight: 800, margin: 0, lineHeight: 1.3 }}>Hi, I am<br /><span style={{ color: "#6366f1" }}>EVAT-AI</span></h2>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                      {FLOWS.map(f => (
                        <div key={f.id} className="flow-card" onClick={handleRasaStart} style={{ borderTop: `3px solid ${f.color}` }}>
                          <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                          <p style={{ color: "#1a1a2e", fontWeight: 700, fontSize: "15px", margin: "0 0 8px 0" }}>{f.title}</p>
                          <p style={{ color: "#999", fontSize: "13px", margin: "0 0 12px 0", lineHeight: "1.5" }}>{f.desc}</p>
                          <span style={{ color: f.color, fontSize: "12px", fontWeight: 600 }}>Get Started →</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Messages */}
                {rasaMessages.map((msg, i) => (
                  <div key={i} className="msg" style={{ marginBottom: "16px" }}>
                    {msg.from === "user" ? (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div className="user-bubble">{msg.text}</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>🤖</div>
                        <div style={{ flex: 1 }}>
                          <div className="bot-bubble" dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                          {msg.buttons?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                              {msg.buttons.map((btn, bi) => (
                                <button key={bi} className="action-chip" onClick={async () => {
                                  setRasaMessages(prev => [...prev, { from: "user", text: btn.title }]);
                                  const r = await sendToRasa(btn.payload);
                                  addRasaBot(r, true);
                                }}>{btn.title}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {rasaLoading && (
                  <div className="msg" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🤖</div>
                    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "4px 18px 18px 18px", padding: "12px 16px", display: "flex", gap: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <span className="dot" /><span className="dot" /><span className="dot" />
                    </div>
                  </div>
                )}

                {/* Flow selector */}
                {showFlows && !rasaLoading && (
                  <div className="msg" style={{ marginBottom: "16px" }}>
                    <p style={{ color: "#bbb", fontSize: "11px", marginBottom: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>Choose a flow</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                      {FLOWS.map(f => (
                        <div key={f.id} className="flow-card" onClick={() => handleFlowSelect(f)} style={{ borderTop: `2px solid ${f.color}`, padding: "14px" }}>
                          <div style={{ fontSize: "20px", marginBottom: "6px" }}>{f.icon}</div>
                          <p style={{ color: "#1a1a2e", fontWeight: 700, fontSize: "13px", margin: "0 0 2px 0" }}>{f.title}</p>
                          <p style={{ color: "#999", fontSize: "11px", margin: 0 }}>{f.desc.split(".")[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connectors */}
                {showConnectors && !rasaLoading && (
                  <div className="msg" style={{ marginBottom: "16px" }}>
                    <p style={{ color: "#bbb", fontSize: "11px", marginBottom: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>Select connector</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {CONNECTORS.map(c => (
                        <button key={c} className="action-chip" onClick={() => handleConnectorSelect(c)}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferences */}
                {showPreferences && !rasaLoading && (
                  <div className="msg" style={{ marginBottom: "16px" }}>
                    <p style={{ color: "#bbb", fontSize: "11px", marginBottom: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>Your preference</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                      {PREFERENCES.map(p => (
                        <div key={p.label} className="flow-card" onClick={() => handlePreferenceSelect(p)} style={{ textAlign: "center", padding: "14px" }}>
                          <div style={{ fontSize: "22px", marginBottom: "6px" }}>{p.icon}</div>
                          <p style={{ color: "#1a1a2e", fontWeight: 700, fontSize: "13px", margin: "0 0 2px 0" }}>{p.label}</p>
                          <p style={{ color: "#999", fontSize: "11px", margin: 0 }}>{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post station */}
                {showPostStation && !rasaLoading && (
                  <div className="msg" style={{ marginBottom: "16px" }}>
                    <p style={{ color: "#bbb", fontSize: "11px", marginBottom: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>What next?</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {POST_STATION.map(a => (
                        <button key={a.label} className="action-chip" onClick={() => handlePostStation(a)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {a.icon} {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={rasaBottomRef} />
              </div>
            </div>

            {/* Rasa input */}
            {showRasaTextInput && (
              <div style={{ padding: "12px 40px 20px", background: "#f8f9fc", borderTop: "1px solid #eee" }}>
                <div style={{ maxWidth: "760px", margin: "0 auto" }}>
                  <div className="input-bar">
                    <input type="text" value={rasaInput}
                      onChange={(e) => setRasaInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRasaTextSubmit()}
                      placeholder={rasaInputPlaceholder}
                      style={{ flex: 1, background: "none", border: "none", color: "#1a1a2e", fontSize: "14px", outline: "none", padding: "8px 0" }}
                      autoFocus />
                    <button className="send-btn" onClick={handleRasaTextSubmit} disabled={rasaLoading || !rasaInput.trim()}
                      style={{ background: rasaLoading || !rasaInput.trim() ? "#ddd" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: rasaLoading || !rasaInput.trim() ? "not-allowed" : "pointer" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                  <p style={{ color: "#bbb", fontSize: "11px", textAlign: "center", marginTop: "6px" }}>{rasaInputPlaceholder}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI TAB ── */}
        {activeTab === "ai" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
              <div style={{ maxWidth: "760px", margin: "0 auto" }}>
                {geminiMessages.length === 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                      <div>
                        <h1 style={{ fontSize: "38px", fontWeight: 800, margin: "0 0 10px 0", color: "#1a1a2e", lineHeight: 1.2 }}>
                          I am <span style={{ color: "#6366f1" }}>EVAT-AI</span><br />
                          <span style={{ color: "#888", fontWeight: 400, fontSize: "32px" }}>Ask me anything</span>
                        </h1>
                        <p style={{ color: "#999", fontSize: "14px", margin: 0 }}>Powered by Gemini AI — range, costs, charging, sustainability and more.</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#bbb", fontSize: "13px", margin: "0 0 4px 0" }}>Hey there 👋</p>
                        <h2 style={{ color: "#1a1a2e", fontSize: "28px", fontWeight: 800, margin: 0, lineHeight: 1.3 }}>Ask me<br /><span style={{ color: "#6366f1" }}>Anything about EVs</span></h2>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      {GEMINI_SUGGESTIONS.map(s => (
                        <div key={s} className="flow-card" onClick={() => handleGeminiSend(s)} style={{ padding: "16px" }}>
                          <p style={{ color: "#555", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>{s}</p>
                          <span style={{ color: "#6366f1", fontSize: "12px", fontWeight: 600, marginTop: "8px", display: "block" }}>Ask this →</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {geminiMessages.map((msg, i) => (
                  <div key={i} className="msg" style={{ marginBottom: "20px" }}>
                    {msg.from === "user" ? (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div className="user-bubble">{msg.text}</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>✨</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "#6366f1", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", margin: "0 0 6px 0" }}>EVAT-AI</p>
                          <div className="bot-bubble" dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {geminiLoading && (
                  <div className="msg" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✨</div>
                    <div className="bot-bubble" style={{ display: "flex", gap: "4px" }}><span className="dot" /><span className="dot" /><span className="dot" /></div>
                  </div>
                )}
                <div ref={geminiBottomRef} />
              </div>
            </div>

            <div style={{ padding: "12px 40px 20px", background: "#f8f9fc", borderTop: "1px solid #eee" }}>
              <div style={{ maxWidth: "760px", margin: "0 auto" }}>
                {!GEMINI_API_KEY && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 16px", marginBottom: "10px", textAlign: "center" }}>
                    <span style={{ color: "#92400e", fontSize: "12px" }}>⚠️ Add VITE_GEMINI_API_KEY to your .env to enable AI chat</span>
                  </div>
                )}
                <div className="input-bar">
                  <span style={{ color: "#bbb", marginRight: "8px", fontSize: "16px" }}>✨</span>
                  <input type="text" value={geminiInput}
                    onChange={(e) => setGeminiInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGeminiSend()}
                    placeholder='Ask anything e.g. "How far can a Tesla go on one charge?"'
                    style={{ flex: 1, background: "none", border: "none", color: "#1a1a2e", fontSize: "14px", outline: "none", padding: "8px 0" }}
                  />
                  <button className="send-btn" onClick={() => handleGeminiSend()} disabled={geminiLoading || !geminiInput.trim()}
                    style={{ background: geminiLoading || !geminiInput.trim() ? "#ddd" : "linear-gradient(135deg,#6366f1,#10b981)", color: "#fff", border: "none", borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: geminiLoading || !geminiInput.trim() ? "not-allowed" : "pointer" }}>
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