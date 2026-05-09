import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CHATBOT_URL = "https://evat-rasa-3cn2oy3gna-ts.a.run.app/webhooks/rest/webhook";

const generateId = () => Math.random().toString(36).substring(2, 10);

const getSessionId = () => {
  const s = localStorage.getItem("evat_chat_session");
  if (s) return s;
  const id = "evat-" + generateId();
  localStorage.setItem("evat_chat_session", id);
  return id;
};

const SUGGESTIONS = [
  "Find charging stations near me",
  "Compare EV vs petrol costs",
  "Plan a route with charging stops",
  "Emergency charging nearby",
  "What is demand forecasting?",
  "How does congestion prediction work?",
];

export default function Chatbot() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("evat_conversations") || "[]");
    } catch { return []; }
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("evat_conversations", JSON.stringify(conversations));
  }, [conversations]);

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const loadChat = (id) => {
    const chat = conversations.find(c => c.id === id);
    if (chat) {
      setActiveChatId(id);
      setMessages(chat.messages);
    }
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) { setActiveChatId(null); setMessages([]); }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { from: "user", text: msg, time: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

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

      const data = await res.json();
      const botMessages = data?.length > 0
        ? data.map(d => ({ from: "bot", text: d.text, buttons: d.buttons || [], time: new Date().toISOString() }))
        : [{ from: "bot", text: "I didn't quite get that. Try asking about charging stations, route planning, or EV costs.", buttons: [], time: new Date().toISOString() }];

      const finalMessages = [...newMessages, ...botMessages];
      setMessages(finalMessages);

      // Save to conversations
      const chatId = activeChatId || generateId();
      if (!activeChatId) setActiveChatId(chatId);

      setConversations(prev => {
        const existing = prev.find(c => c.id === chatId);
        if (existing) {
          return prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() } : c);
        }
        return [{ id: chatId, title: msg.slice(0, 40), messages: finalMessages, updatedAt: new Date().toISOString() }, ...prev];
      });

    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Sorry, I'm having trouble connecting. Please try again.", time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  const groupByDate = (convs) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const week = new Date(today); week.setDate(week.getDate() - 7);
    const groups = { "Today": [], "Yesterday": [], "Last 7 Days": [], "Older": [] };
    convs.forEach(c => {
      const d = new Date(c.updatedAt); d.setHours(0,0,0,0);
      if (d >= today) groups["Today"].push(c);
      else if (d >= yesterday) groups["Yesterday"].push(c);
      else if (d >= week) groups["Last 7 Days"].push(c);
      else groups["Older"].push(c);
    });
    return groups;
  };

  const grouped = groupByDate(conversations);
  const isNew = messages.length === 0;

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0a0d0b", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        .msg-row { animation: fadeUp 0.25s ease forwards; }
        .dot { width:6px;height:6px;border-radius:50%;background:#00b482;display:inline-block;animation:typingDot 1.2s infinite; }
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        .conv-item:hover { background: rgba(255,255,255,0.06) !important; }
        .conv-item.active { background: rgba(0,180,130,0.1) !important; border-left: 2px solid #00b482 !important; }
        .suggestion:hover { background: rgba(0,180,130,0.1) !important; border-color: rgba(0,180,130,0.4) !important; color: #fff !important; }
        .send-btn:hover:not(:disabled) { background: #00c990 !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width: "260px", backgroundColor: "#0f1610", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Sidebar header */}
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>🤖</span>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>EV Assistant</span>
              </div>
              <button onClick={() => navigate("/use-cases")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "16px", padding: "2px" }} title="Back">✕</button>
            </div>
            <button onClick={startNewChat} style={{ width: "100%", backgroundColor: "#00b482", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 14px", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <span style={{ fontSize: "16px" }}>+</span> New Chat
            </button>
          </div>

          {/* Conversations */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {conversations.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>No conversations yet</p>
            ) : (
              Object.entries(grouped).map(([group, convs]) => convs.length > 0 && (
                <div key={group} style={{ marginBottom: "16px" }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 8px", margin: "0 0 4px 0" }}>{group}</p>
                  {convs.map(c => (
                    <div key={c.id} className={`conv-item ${activeChatId === c.id ? "active" : ""}`}
                      onClick={() => loadChat(c.id)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", cursor: "pointer", borderLeft: "2px solid transparent", transition: "all 0.15s", marginBottom: "2px" }}>
                      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.title}</span>
                      <button onClick={(e) => deleteChat(e, c.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "12px", padding: "0 0 0 6px", flexShrink: 0 }}>🗑</button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Location status */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: location ? "#34d399" : "#f87171", display: "inline-block" }} />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>{location ? "Location enabled" : "Location disabled"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "18px", padding: "2px 6px" }}>☰</button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>EV Assistant <span style={{ color: "#00b482" }}>·</span> Powered by Rasa</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>

          {/* Empty state */}
          {isNew && (
            <div style={{ maxWidth: "680px", margin: "60px auto 0", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>🤖</div>
              <h2 style={{ color: "#fff", fontSize: "28px", fontWeight: 700, margin: "0 0 8px 0" }}>EV Charging <span style={{ color: "#00b482" }}>Assistant</span></h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "0 0 40px 0" }}>Ask me about charging stations, route planning, EV costs, or anything about the EVAT platform.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: "left" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className="suggestion" onClick={() => sendMessage(s)}
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px 16px", color: "rgba(255,255,255,0.6)", fontSize: "13px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", lineHeight: "1.4" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          <div style={{ maxWidth: "720px", margin: "0 auto", paddingTop: "32px", paddingBottom: "20px" }}>
            {messages.map((msg, i) => (
              <div key={i} className="msg-row" style={{ marginBottom: "28px" }}>
                {msg.from === "user" ? (
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, marginTop: "2px" }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "0 0 4px 0", fontWeight: 600 }}>YOU · {formatTime(msg.time)}</p>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(0,180,130,0.15)", border: "1px solid rgba(0,180,130,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, marginTop: "2px" }}>🤖</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#00b482", fontSize: "11px", margin: "0 0 4px 0", fontWeight: 700, letterSpacing: "0.5px" }}>EV ASSISTANT · {formatTime(msg.time)}</p>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: 0, lineHeight: "1.9", whiteSpace: "pre-wrap" }}
                        dangerouslySetInnerHTML={{ __html: msg.text
                          .replace(/[\u{1F4CD}\u{26A1}\u{1F4B0}\u{1F3AF}\u274C\u2705\u{1F4A1}\u{1F50C}\u{1F5FA}\u{1F697}\u{1F50B}]/gu, '')
                          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .trim()
                        }}
                      />
                      {msg.buttons?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                          {msg.buttons.map((btn, bi) => (
                            <button key={bi} onClick={() => sendMessage(btn.payload)}
                              style={{ backgroundColor: "rgba(0,180,130,0.12)", border: "1px solid rgba(0,180,130,0.4)", borderRadius: "20px", color: "#00b482", fontSize: "13px", fontWeight: 600, padding: "7px 16px", cursor: "pointer", transition: "all 0.2s", fontFamily: "'Segoe UI', sans-serif" }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(0,180,130,0.25)"; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(0,180,130,0.12)"; e.currentTarget.style.color = "#00b482"; }}
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing */}
            {loading && (
              <div className="msg-row" style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "28px" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(0,180,130,0.15)", border: "1px solid rgba(0,180,130,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>🤖</div>
                <div style={{ paddingTop: "10px", display: "flex", gap: "4px" }}>
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: "16px 24px 24px" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", padding: "4px 4px 4px 16px", transition: "border-color 0.2s" }}>
              <input ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about EV charging, routes, or nearby stations..."
                style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: "14px", outline: "none", padding: "10px 0" }}
              />
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}
                style={{ backgroundColor: loading || !input.trim() ? "rgba(0,180,130,0.3)" : "#00b482", color: "#fff", border: "none", borderRadius: "8px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>
              Powered by Rasa · {location ? "📍 Location enabled for station search" : "📍 Enable location for nearby stations"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}