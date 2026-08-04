import { useState } from "react";
import ChargingRecommendationCard from "./ChargingRecommendationCard";  
import { 
    getChargingRecommendations, 
    selectChargingStation,
} from "../services/chargingRecommendationService.js";
import "../styles/ChargingRecommendations.css";

function ChargingRecommendations() {
    /* const mockRecommendations = [
  {
    rank: 1,
    stationId: "station-001",
    operator: "Chargefox",
    latitude: -37.8142,
    longitude: 144.9618,
    connectionType: "Type 2",
    currentType: "DC",
    chargingPoints: 4,
    cost: "$0.40/kWh",
    distanceKm: 1.8,
    reasons: [
      "Low station congestion",
      "Low energy required to reach",
      "Nearby station",
    ],
  },
  {
    rank: 2,
    stationId: "station-002",
    operator: "Evie Networks",
    latitude: -37.8185,
    longitude: 144.9701,
    connectionType: "CCS2",
    currentType: "DC",
    chargingPoints: 6,
    cost: "$0.45/kWh",
    distanceKm: 2.4,
    reasons: [
      "Multiple charging points available",
      "Fast charging supported",
      "Good distance from current location",
    ],
  },
  {
    rank: 3,
    stationId: "station-003",
    operator: "Ampol AmpCharge",
    latitude: -37.821,
    longitude: 144.955,
    connectionType: "CCS2",
    currentType: "DC",
    chargingPoints: 3,
    cost: "$0.42/kWh",
    distanceKm: 3.1,
    reasons: [
      "Reliable charging location",
      "Fast charging available",
      "Alternative nearby station",
    ],
  },
  {
    rank: 4,
    stationId: "station-004",
    operator: "AmpCharge",
    latitude: -37.81,
    longitude: 144.95,
    connectionType: "CCS4",
    currentType: "DC",
    chargingPoints: 4,
    cost: "$0.42/kWh",
    distanceKm: 3.1,
    reasons: [
      "Reliable charging location",
      "Fast charging available",
      "Alternative nearby station",
        ],
},
]  
*/ 
  /*  const [recommendations, setRecommendations] = useState(mockRecommendations); /* For using the mock data present up  */  
  const [recommendations, setRecommendations] = useState([]); 
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
    
  const handleGetRecommendations = () => {
    setLoading(true);
    setError("");
    setHasSearched(false);
    setRecommendations([]);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;

                const data = await getChargingRecommendations(latitude, longitude);

                setRecommendations(data.recommendations || []);
                setSessionId(data.sessionId);
                setHasSearched(true);
            } catch (err) {
                setError("Unable to get charging recommendations.");
            } finally {
                setLoading(false);
            }
        },
        () => {
            setError("Unable to access your location.");
            setLoading(false);
        }
    );
  }; 


  const handleSelectStation = async (station) => {
    try {
        await selectChargingStation(sessionId, station.stationId);

        const mapsUrl= `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

        window.open(mapsUrl, "_blank");
    } catch (err) {
        setError("Unable to select charging station.");
    }
  };

 return (
  <div
    className={`charging-recommendations ${
      isMinimized ? "charging-recommendations--minimized" : ""
    }`}
  >
    <div className="recommendations-header">
      <div>
        <h2> ⚡Charging Recommendations</h2>

        {!isMinimized && (
          <p className="recommendations-subtitle">
            Find the best charging stations near your current location.
          </p>
        )}
      </div>

      <button
        className="recommendations-toggle"
        onClick={() => setIsMinimized(!isMinimized)}
        aria-label={isMinimized ? "Expand recommendations" : "Minimize recommendations"}
      >
        {isMinimized ? "+" : "−"}
      </button>
    </div>

    {!isMinimized && (
      <>
        <button
          className="find-stations-btn"
          onClick={handleGetRecommendations}
          disabled={loading}
        >
          {loading ? "Finding stations..." : "Find Charging Stations"}
        </button>

        {error && (
          <p className="recommendations-error">
        {error}
          </p>
        )
        }

        {hasSearched && !loading && !error && recommendations.length === 0 && (
          <p className="recommendations-empty">
            no charging recommendation found near your location.
          </p>  
        )}

        <div className="recommendations-list">
          {recommendations.map((station) => (
            <ChargingRecommendationCard
              key={station.stationId}
              station={station}
              onSelect={handleSelectStation}
            />
          ))}
        </div>
      </>
    )}
  </div>
)
};

export default ChargingRecommendations;
