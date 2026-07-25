import { useState, useEffect, useContext } from "react";
import EnvironmentalImpact from "../components/EnvironmentalImpact";
import NavBar from "../components/NavBar";
import { UserContext } from "../context/user";

const API_URL = import.meta.env.VITE_API_URL;

export default function EnvironmentalImpactPage() {
  const { user } = useContext(UserContext);
  const [allElectricVehicles, setAllElectricVehicles] = useState([]);
  const [makes, setMakes] = useState(["Select"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for user context to hydrate
    if (user === null) return;

    if (!user?.token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/vehicle`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = (data.data || data || []).map((v) => ({
          ...v,
          id: v.id || v._id,
          year: v.year || v.model_release_year,
        }));
        setAllElectricVehicles(items);
        setMakes(["Select", ...new Set(items.map((v) => v.make))]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a1a0f" }}>
      <NavBar />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 800, margin: "0 0 12px 0" }}>
          EV vs ICE <span style={{ color: "#00b482" }}>Environmental Impact</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0 0 40px 0" }}>
          Compare CO2 emissions, fuel consumption, and environmental footprint.
        </p>

        {/* Wait for context to hydrate */}
        {user === null && (
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
        )}

        {/* User loaded but no token */}
        {user !== null && !user?.token && (
          <p style={{ color: "#f87171" }}>Please log in to access this page.</p>
        )}

        {/* User loaded and has token */}
        {user !== null && user?.token && (
          loading ? (
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading vehicles...</p>
          ) : (
            <EnvironmentalImpact
              user={user}
              allElectricVehicles={allElectricVehicles}
              makes={makes}
            />
          )
        )}
      </div>
    </div>
  );
}