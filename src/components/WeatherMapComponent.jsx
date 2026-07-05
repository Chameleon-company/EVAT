import React, { useEffect, useState, useMemo, useContext, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import { UserContext } from '../context/user';
import { predictWeatherAwareRouting } from '../services/weatherAwareRoutingService';
import LocateUser from './LocateUser';
import WeatherAwareSelection from './WeatherAwareSelection';
import WeatherAwareResult from './WeatherAwareResult';

// styles
import '../styles/Root.css';
import '../styles/Map.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';

// Watches map bounds (bbox) and reports them upward
function BoundsWatcher({ onChange }) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds();
      onChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    }
  });

  useEffect(() => {
    const b = map.getBounds();
    onChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }, [map, onChange]);

  return null;
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      });
    },
  });

  return null;
}

export default function Map() {
  const { user } = useContext(UserContext);

  const [bbox, setBbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // local UI state for the floating dark-mode button icon
  const [isDark, setIsDark] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weatherYear, setWeatherYear] = useState(2023);
  const [weatherResult, setWeatherResult] = useState({
    prediction: null,
    dist_to_nearest_ev_m: null,
    ev_within_500m: null,
    avg_temp: null,
    total_prcp: null,
    used_SHAPE_Length: null
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const handleCalculateEnergy = async () => {
    if (!selectedLocation) {
      setWeatherError("Please click on the map to select a location first.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');

    try {
      const payload = {
        year: Number(weatherYear),
        start_lat: selectedLocation.lat,
        start_lon: selectedLocation.lon,
      };
      const data = await predictWeatherAwareRouting(payload, user?.token);
      setWeatherResult({...weatherResult,
        prediction: data.prediction,
        dist_to_nearest_ev_m: data.dist_to_nearest_ev_m,
        ev_within_500m: data.ev_within_500m,
        avg_temp: data.avg_temp,
        total_prcp: data.total_prcp,
        used_SHAPE_Length: data.used_SHAPE_Length});
    } catch (error) {
      console.log(error);
      setWeatherError(error.message || "Something went wrong while calculating energy.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setSelectedLocation(null);
    setWeatherResult({...weatherResult, prediction: null});
    setWeatherError(null);
    setMapCenter(defaultCenter);
  }, []);

  // toggle dark mode only when inside the Map page
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    return () => {
      document.body.classList.remove("dark-mode");
    };
  }, [isDark]);

  return (
    <div className={`map-page ${isDark ? "dark" : ""}`}>
      <div className='container-map'>
        {!bbox && !loading && user?.token && (
          <div className="map-status-message map-info" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            background: '#e3f2fd',
            color: '#1565c0',
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: 500,
            borderLeft: '4px solid #2196f3',
            maxWidth: '320px',
            lineHeight: '1.5'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              📍 Map Loading
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Wait for map to load or move/zoom to search for chargers
            </div>
          </div>
        )}
        {!user?.token && (
          <div className="map-status-message map-warning" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            background: '#fff3cd',
            color: '#856404',
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: 500,
            borderLeft: '4px solid #ffc107',
            maxWidth: '300px'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              ⚠️ Login Required
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Please log in to search for charging stations
            </div>
          </div>
        )}

        <WeatherAwareSelection
        selectedLocation={selectedLocation}
        weatherYear={weatherYear}
        weatherError={weatherError}
        weatherLoading={weatherLoading}
        onClick={handleCalculateEnergy}
        handleReset={handleReset}
        isDark={isDark}/>

        <MapContainer
          className="map-visible-area hide-scrollbar"
          center={[-37.8136, 144.9631]}
          zoom={13}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <BoundsWatcher onChange={setBbox} />
          <MapClickHandler onLocationSelect={setSelectedLocation} />
          
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lon]} />
          )}
          <LocateUser />
        </MapContainer>

        {weatherResult.prediction && <WeatherAwareResult weatherResult={weatherResult} isDark={isDark} />}

        <button
          className="btn btn-primary btn-dark-mode"
          aria-label="Toggle dark mode"
          onClick={() => setIsDark(prev => !prev)}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '🌙' : '☀️'}
        </button>
      </div>
    </div>
  );
}