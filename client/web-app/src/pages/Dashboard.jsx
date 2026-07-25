import { useNavigate } from "react-router-dom";
import { useState } from "react";
import NavBar from "../components/NavBar";

const useCases = [
  {
    id: "cost-comparison",
    title: "Cost Comparison",
    description: "Compare the total cost of owning an EV vs a petrol vehicle over time.",
    icon: "💰",
    route: "/cost",
    status: "live",
  },
  {
    id: "environmental-impact",
    title: "Environmental Impact",
    description: "Analyse carbon emissions and sustainability metrics for EV adoption.",
    icon: "🌿",
    route: "/environmental-impact",
    status: "live",
  },
  {
    id: "demand-forecasting",
    title: "Demand Forecasting",
    description: "Predict future EV demand trends across regions using ML models.",
    icon: "📈",
    route: "/demand-forecasting",
    status: "live",
  },
  {
  id: "personalised-insights",
  title: "Personalised EV Insights",
  description: "Get personalised recommendations based on your driving habits and lifestyle.",
  icon: "🔍",
  route: "/insights-form",
  status: "live",
},
  {
  id: "congestion-prediction",
  title: "Congestion Prediction",
  icon: "🚦",
  route: "/map",
  description: "Forecast charging station congestion to optimise your travel planning.",
  status: "live",
  },
  {
    id: "weather-routing",
    title: "Weather-Aware Routing",
    description: "Get optimal EV routes factoring in weather, terrain, and range impact.",
    icon: "🗺️",
    route: "/weather-aware-routing",
    status: "live",
  },
  {
    id: "chatbot",
    title: "EV Assistant",
    description: "Ask our AI assistant anything about EVs, charging, and adoption.",
    icon: "🤖",
    route: "/chatbot",
    status: "live",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div style={styles.page}>
        <NavBar />
      {/* Background geometric accent */}
      <div style={styles.bgAccent} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>EVAT PLATFORM</div>
          <h1 style={styles.title}>
            Electric Vehicle
            <br />
            <span style={styles.titleAccent}>Adoption Tool</span>
          </h1>
          <p style={styles.subtitle}>
            Select a use case below to explore insights, predictions, and analysis
            powered by real-world data.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={styles.grid}>
          {useCases.map((uc) => {
            const isHovered = hoveredId === uc.id;
            const isComingSoon = uc.status === "coming-soon";

            return (
              <div
                key={uc.id}
                style={{
                  ...styles.card,
                  ...(isHovered && !isComingSoon ? styles.cardHover : {}),
                  ...(isComingSoon ? styles.cardDisabled : {}),
                  cursor: isComingSoon ? "not-allowed" : "pointer",
                }}
                onMouseEnter={() => setHoveredId(uc.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => !isComingSoon && navigate(uc.route)}
              >
                {/* Top accent line */}
                <div
                  style={{
                    ...styles.cardAccentLine,
                    opacity: isHovered && !isComingSoon ? 1 : 0,
                  }}
                />

                {/* Coming soon badge */}
                {isComingSoon && (
                  <div style={styles.comingSoonBadge}>Coming Soon</div>
                )}

                {/* Icon */}
                <div style={styles.iconWrapper}>
                  <span style={styles.icon}>{uc.icon}</span>
                </div>

                {/* Content */}
                <h2 style={styles.cardTitle}>{uc.title}</h2>
                <p style={styles.cardDesc}>{uc.description}</p>

                {/* Arrow */}
                {!isComingSoon && (
                  <div
                    style={{
                      ...styles.arrow,
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered
                        ? "translateX(0)"
                        : "translateX(-8px)",
                    }}
                  >
                    Explore →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p style={styles.footerNote}>
          More use cases will be added as the project progresses.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0a1a0f",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bgAccent: {
    position: "absolute",
    top: "-200px",
    right: "-200px",
    width: "600px",
    height: "600px",
    background:
      "radial-gradient(circle, rgba(0, 180, 130, 0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 24px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    marginBottom: "56px",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "rgba(0, 180, 130, 0.15)",
    color: "#00b482",
    border: "1px solid rgba(0, 180, 130, 0.3)",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "2px",
    padding: "6px 14px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "clamp(36px, 5vw, 56px)",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.1",
    margin: "0 0 16px 0",
  },
  titleAccent: {
    color: "#00b482",
  },
  subtitle: {
    fontSize: "16px",
    color: "rgba(255,255,255,0.5)",
    maxWidth: "500px",
    lineHeight: "1.6",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "32px",
    transition: "all 0.25s ease",
    overflow: "hidden",
  },
  cardHover: {
    backgroundColor: "rgba(0, 180, 130, 0.07)",
    border: "1px solid rgba(0, 180, 130, 0.35)",
    transform: "translateY(-4px)",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
  },
  cardDisabled: {
    opacity: 0.45,
  },
  cardAccentLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "linear-gradient(90deg, #00b482, #00e0a0)",
    transition: "opacity 0.25s ease",
  },
  comingSoonBadge: {
    position: "absolute",
    top: "16px",
    right: "16px",
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.4)",
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "1px",
    padding: "4px 10px",
    borderRadius: "4px",
  },
  iconWrapper: {
    width: "48px",
    height: "48px",
    backgroundColor: "rgba(0, 180, 130, 0.1)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  icon: {
    fontSize: "22px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 10px 0",
  },
  cardDesc: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.5)",
    lineHeight: "1.6",
    margin: "0 0 20px 0",
  },
  arrow: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#00b482",
    transition: "all 0.25s ease",
  },
  footerNote: {
    textAlign: "center",
    color: "rgba(255,255,255,0.2)",
    fontSize: "13px",
    marginTop: "48px",
  },
};




















