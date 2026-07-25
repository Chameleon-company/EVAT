import { useState, useEffect, useRef } from "react";

const CHATBOT_URL = "https://evat-rasa-3cn2oy3gna-ts.a.run.app/webhooks/rest/webhook";

const generateSessionId = () => {
  const stored = localStorage.getItem("evat_chat_session");
  if (stored) return stored;
  const id = "evat-" + Math.random().toString(36).substring(2, 12);
  localStorage.setItem("evat_chat_session", id);
  return id;
};

export default function EVChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi! Ask me anything about EVs or charging stations." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const sessionId = generateSessionId();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setLoading(true);

    try {
      const body = {
        sender: sessionId,
        message: userMsg,
        ...(location && { metadata: { latitude: location.latitude, longitude: location.longitude } })
      };

      const res = await fetch(CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data && data.length > 0) {
        data.forEach((msg, i) => {
          setTimeout(() => {
            setMessages(prev => [...prev, { from: "bot", text: msg.text }]);
            if (!open) setUnread(u => u + 1);
          }, i * 400);
        });
      } else {
        setMessages(prev => [...prev, { from: "bot", text: "I didn't quite get that. Could you rephrase?" }]);
      }
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes pingAnim { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(2.2);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes typingDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        .ev-msg { animation: fadeUp 0.3s ease forwards; }
        .ev-typing-dot { width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.5);display:inline-block;animation:typingDot 1.2s infinite; }
        .ev-typing-dot:nth-child(2){animation-delay:0.2s}
        .ev-typing-dot:nth-child(3){animation-delay:0.4s}
      `}</style>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px", width: "360px", height: "480px",
          backgroundColor: "#0a1a0f", border: "1px solid rgba(0,180,130,0.3)", borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column",
          zIndex: 9999, animation: "slideUp 0.25s ease forwards", fontFamily: "'Segoe UI', sans-serif",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{ backgroundColor: "#00b482", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
              <div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: "13px", margin: 0 }}>EV Assistant</p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
                    <span style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#fff", opacity: 0.4, animation: "pingAnim 1.4s infinite" }} />
                    <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#fff", display: "inline-block", margin: "1.5px" }} />
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer", opacity: 0.8, padding: "4px" }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg, i) => (
              <div key={i} className="ev-msg" style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%",
                  backgroundColor: msg.from === "user" ? "#00b482" : "rgba(255,255,255,0.07)",
                  color: "#fff",
                  borderRadius: msg.from === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  padding: "9px 12px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  border: msg.from === "bot" ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ev-msg" style={{ display: "flex" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", display: "flex", gap: "4px", alignItems: "center" }}>
                  <span className="ev-typing-dot" />
                  <span className="ev-typing-dot" />
                  <span className="ev-typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "9px 12px", color: "#fff", fontSize: "13px", outline: "none" }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ backgroundColor: loading || !input.trim() ? "rgba(0,180,130,0.3)" : "#00b482", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 14px", fontWeight: 700, fontSize: "13px", cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}>
              →
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "56px", height: "56px", borderRadius: "50%",
          backgroundColor: "#00b482", border: "none",
          boxShadow: "0 8px 24px rgba(0,180,130,0.4)",
          cursor: "pointer", fontSize: "22px",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,180,130,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,180,130,0.4)"; }}
      >
        {open ? "✕" : "🤖"}
        {!open && unread > 0 && (
          <span style={{ position: "absolute", top: "-4px", right: "-4px", backgroundColor: "#f87171", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread}
          </span>
        )}
      </button>
    </>
  );
}