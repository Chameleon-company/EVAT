import { useNavigate } from "react-router-dom";

export default function WeatherRouting() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a1a0f", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", fontFamily: "Segoe UI, sans-serif" }}>
      <h1>🗺️ Weather-Aware Routing</h1>
      <p style={{ color: "rgba(255,255,255,0.5)" }}>Coming soon.</p>
      <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "1px solid #00b482", color: "#00b482", padding: "8px 20px", borderRadius: "6px", cursor: "pointer" }}>← Back to Dashboard</button>
    </div>
  );
}



// MVP ~ Weather-Aware Routing: User to input the start and end locations, and the system will provide a route that takes into account current weather conditions. This could include avoiding areas with heavy rain, strong winds, or other adverse weather phenomena. The system could also provide estimated travel times based on the weather conditions along the route.
// model does calculate the best route based on weather conditions, but the UI is not yet implemented. The user interface will allow users to input their start and end locations, and then display the recommended route along with any relevant weather information.
//It will show the user that best route based on the weather conditions, and provide estimated travel times. The user interface will be designed to be intuitive and user-friendly, allowing users to easily input their locations and understand the recommended route and weather conditions.
//