import React from "react";

import "../styles/Map.css"

export default function WeatherAwareResult({weatherResult, isDark}) {
    return(
        <div className={`overlay ${isDark ? "dark" : ""}`} style={{
        right: 50,
        bottom: 90,
        }}>
        <h2 style={{
            fontSize: '22px',
            fontWeight: '800',
            marginBottom: '8px',
            color: '#4285f4'
        }}>
            Prediction Results
        </h2>

        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
            <div>
                <p style={{
                    color: '#34a853',
                    fontSize: '32px',
                    marginBottom: '0'
                }}>
                    {weatherResult.prediction.toFixed(2)} kWh
                </p>
                <p style={{color: '#666'}}>Predicted Energy Cosumption</p>
            </div>
            <div><strong>Nearest EV:</strong> {Math.round(weatherResult.dist_to_nearest_ev_m)} m</div>
            <div><strong>EV within 500m:</strong> {weatherResult.ev_within_500m ? "Yes" : "No"}</div>
            <div><strong>Avg Temp:</strong> {weatherResult.avg_temp.toFixed(1)} °C</div>
            <div><strong>Precipitation:</strong> {Math.round(weatherResult.total_prcp)}</div>
            <div><strong>Road Length:</strong> {weatherResult.used_SHAPE_Length.toFixed(2)}</div>
        </div>
        </div>
    );
}