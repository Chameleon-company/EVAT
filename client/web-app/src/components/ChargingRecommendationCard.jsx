import { useState } from "react";

function ChargingRecommendationCard({ station, onSelect }) {
    const [showReasons, setShowReasons] = useState(false);
  return (
    <div className="recommendation-card">
      <h3>
        #{station.rank} {station.operator}
      </h3>

      <p>Distance: {station.distanceKm} km</p>
      <p>Cost: {station.cost}</p>
      <p>Connection: {station.connectionType}</p>
      <p>Current: {station.currentType}</p>
      <p>Charging Points: {station.chargingPoints}</p>

      <button onClick={() => setShowReasons(!showReasons)}>
        {showReasons ? "Hide Reasons" : "Why recommend?"}
      </button>

      <button onClick={() => onSelect(station)}>
        Navigate
      </button>

      {showReasons && (
        <ul>
            {station.reasons?.map((reason, index) => (
                <li key={index}> {reason} </li>
            ))}
        </ul>
      )}
      
    </div>
  );
}

export default ChargingRecommendationCard;
