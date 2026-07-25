import React from "react";
import { useNavigate } from 'react-router-dom';

import "../styles/Map.css"
import "../styles/Buttons.css"

export default function WeatherAwareSelection({selectedLocation, weatherYear, weatherLoading, weatherError, onClick, handleReset, isDark}) {
    const navigate = useNavigate();

    return (
        <div className={`overlay ${isDark ? "dark" : ""}`} style={{
            top: 90,
            left: 24,
        }}>
            <h2 style={{
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '16px',
            color: '#111827'
            }}>
            Weather-Aware Routing
            </h2>
            {/* color: '#4b5563' */}
            <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                <p><strong>Lat:</strong> {selectedLocation?.lat.toFixed(5)}</p>
                <p><strong>Lon:</strong> {selectedLocation?.lon.toFixed(5)}</p>
            </div>

            <button
            onClick={onClick}
            disabled={weatherLoading}
            style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(34,197,94,0.3)'
            }}
            >
            {weatherLoading ? "Calculating..." : "Calculate Energy"}
            </button>

            <button
            onClick={handleReset}
            style={{
                width: '100%',
                marginTop: '10px',
                padding: '14px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)'
            }}>
            Reset
            </button>

            {weatherError && (
            <p style={{
                color: '#dc2626',
                marginTop: '10px',
                fontSize: '13px',
                textAlign: 'center'
            }}>
                {weatherError}
            </p>
            )}

            <hr className="separator"></hr>

            <button
            onClick={() => navigate('/profile')}
            style={{
                width: '100%',
                marginTop: '10px',
                padding: '14px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)'
            }}>Back to Dashboard
            </button>
        </div>
    );
}