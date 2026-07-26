import React, { useEffect, useState, useContext, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Polyline } from 'react-leaflet';
import polyline from '@mapbox/polyline';
import { UserContext } from '../context/user';
import { predictWeatherAwareRouting } from '../services/weatherAwareRoutingService';

import WeatherAwareSelection from './WeatherAwareSelection';
import WeatherAwareResult from './WeatherAwareResult';
import TurnByTurnOverlay from "./TurnByTurnOverlayRouting";

// styles
import '../styles/Root.css';
import '../styles/Map.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';

// Watches map bounds and reports them upward
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

// Handles map click
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

const styles = {
  resultPanel: {
    position: "absolute",
    right: "24px",
    bottom: "80px",
    width: "420px",
    maxWidth: "calc(100% - 48px)",
    zIndex: 1000,
  },
};

export default function Map() {
  const { user } = useContext(UserContext);

  const [bbox, setBbox] = useState(null);
  const [loading] = useState(false);

  const [isDark, setIsDark] = useState(false);

  // Route selection state
  const [originLocation, setOriginLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [activeField, setActiveField] = useState("origin");
  const [acOn, setAcOn] = useState(true);

  const [weatherResult, setWeatherResult] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Convert map coordinates into a readable address using Google Geocoding API
  const getAddressFromCoordinates = async (lat, lon) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error("Google Maps API key is missing. Please add it to your .env file.");
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    throw new Error("Could not convert this map location into an address.");
  };

  // When user clicks map, convert coordinates into address first
  const handleLocationSelect = async (location) => {
    setWeatherResult(null);
    setWeatherError("");
    setRouteCoordinates([]);

    try {
      const address = await getAddressFromCoordinates(location.lat, location.lon);

      const selectedLocation = {
        address: address,
        lat: location.lat,
        lon: location.lon,
      };

      if (activeField === "origin") {
        setOriginLocation(selectedLocation);
        setActiveField("destination");
      } else {
        setDestinationLocation(selectedLocation);
      }
    } catch (error) {
      console.log(error);
      setWeatherError(error.message || "Could not read this map location.");
    }
  };

  // Used by Google Place Autocomplete
  const handlePlaceSelect = (fieldName, place) => {
    const selectedLocation = {
      address: place.address,
      lat: place.lat,
      lon: place.lon,
    };

    if (fieldName === "origin") {
      setOriginLocation(selectedLocation);
      setActiveField("destination");
    } else {
      setDestinationLocation(selectedLocation);
    }

    setWeatherResult(null);
    setWeatherError("");
    setRouteCoordinates([]);
  };

  const handleCalculateEnergy = async () => {
    if (!originLocation || !destinationLocation) {
      setWeatherError("Please select both origin and destination.");
      return;
    }

    if (!originLocation.address || !destinationLocation.address) {
      setWeatherError("Please select valid origin and destination addresses.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');

    try {
      // Backend now expects address/location text, not coordinates
      const payload = {
        origin: originLocation.address,
        destination: destinationLocation.address,
        ac_on: acOn,
      };
      console.log(payload);

      const data = await predictWeatherAwareRouting(payload, user?.token);

      setWeatherResult(data);

      // Decode model/backend polyline and draw it on Leaflet map
      if (data?.polyline) {
        const decodedRoute = polyline.decode(data.polyline);
        setRouteCoordinates(decodedRoute);
      } else {
        setRouteCoordinates([]);
      }

    } catch (error) {
      console.log(error);
      setWeatherError(error.message || "Something went wrong while calculating energy.");
      setRouteCoordinates([]);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setOriginLocation(null);
    setDestinationLocation(null);
    setActiveField("origin");
    setAcOn(true);
    setWeatherResult(null);
    setRouteCoordinates([]);
    setWeatherError("");
  }, []);

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
              Please log in to use weather-aware routing
            </div>
          </div>
        )}

        <WeatherAwareSelection
          originLocation={originLocation}
          destinationLocation={destinationLocation}
          activeField={activeField}
          setActiveField={setActiveField}
          acOn={acOn}
          setAcOn={setAcOn}
          weatherError={weatherError}
          weatherLoading={weatherLoading}
          onClick={handleCalculateEnergy}
          handleReset={handleReset}
          isDark={isDark}
          onPlaceSelect={handlePlaceSelect}
        />

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
          <MapClickHandler onLocationSelect={handleLocationSelect} />

          {originLocation && originLocation.lat && originLocation.lon && (
            <Marker position={[originLocation.lat, originLocation.lon]} />
          )}

          {destinationLocation && destinationLocation.lat && destinationLocation.lon && (
            <Marker position={[destinationLocation.lat, destinationLocation.lon]} />
          )}

          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: "#16a34a",
                weight: 6,
                opacity: 0.85,
              }}
            />
          )}
        </MapContainer>

        {weatherResult?.steps && (
          <TurnByTurnOverlay steps={weatherResult.steps} isDark={isDark} />
        )}

        {weatherResult && (
          <div style={styles.resultPanel}>
            <WeatherAwareResult result={weatherResult} isDark={isDark} />
          </div>
        )}

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