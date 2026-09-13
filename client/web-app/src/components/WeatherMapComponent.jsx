import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Polyline,
} from "react-leaflet";
import polyline from "@mapbox/polyline";
import { UserContext } from "../context/user";
import { predictWeatherAwareRouting } from "../services/weatherAwareRoutingService";

import WeatherAwareSelection from "./WeatherAwareSelection";
import WeatherAwareResult from "./WeatherAwareResult";
import TurnByTurnOverlay from "./TurnByTurnOverlayRouting";

function BoundsWatcher({ onChange }) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds();
      onChange([
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth(),
      ]);
    },
  });

  useEffect(() => {
    const b = map.getBounds();

    onChange([
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ]);
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
  const [loading] = useState(false);

  const [isDark, setIsDark] = useState(false);

  const [originLocation, setOriginLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [activeField, setActiveField] = useState("origin");
  const [acOn, setAcOn] = useState(true);

  const [weatherResult, setWeatherResult] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const getAddressFromCoordinates = async (lat, lon) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Google Maps API key is missing. Please add it to your .env file."
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    throw new Error(
      "Could not convert this map location into an address."
    );
  };

  const handleLocationSelect = async (location) => {
    setWeatherResult(null);
    setWeatherError("");
    setRouteCoordinates([]);

    try {
      const address = await getAddressFromCoordinates(
        location.lat,
        location.lon
      );

      const selectedLocation = {
        address,
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
      setWeatherError(
        error.message || "Could not read this map location."
      );
    }
  };

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
      setWeatherError(
        "Please select both origin and destination."
      );
      return;
    }

    if (!originLocation.address || !destinationLocation.address) {
      setWeatherError(
        "Please select valid origin and destination addresses."
      );
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");

    try {
      const payload = {
        origin: originLocation.address,
        destination: destinationLocation.address,
        ac_on: acOn,
      };

      console.log(payload);

      const data = await predictWeatherAwareRouting(
        payload,
        user?.token
      );

      setWeatherResult(data);

      if (data?.polyline) {
        const decodedRoute = polyline.decode(data.polyline);
        setRouteCoordinates(decodedRoute);
      } else {
        setRouteCoordinates([]);
      }
    } catch (error) {
      console.log(error);

      setWeatherError(
        error.message ||
          "Something went wrong while calculating energy."
      );

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
    <div
      className={`relative h-[calc(100vh-64px)] min-h-[650px] w-full overflow-hidden ${
        isDark
          ? "dark bg-black text-white"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="relative h-full w-full overflow-hidden">
        {!bbox && !loading && user?.token && (
          <div
            className={`absolute left-4 top-4 z-[1100] max-w-xs rounded-xl border px-4 py-3 shadow-lg ${
              isDark
                ? "border-emerald-900/60 bg-[#050806]/95 text-emerald-300"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">📍</span>

              <div>
                <p className="text-sm font-bold">
                  Map Loading
                </p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    isDark
                      ? "text-emerald-400"
                      : "text-blue-700"
                  }`}
                >
                  Wait for the map to load or move/zoom to search
                  for chargers.
                </p>
              </div>
            </div>
          </div>
        )}

        {!user?.token && (
          <div
            className={`absolute left-4 top-4 z-[1100] max-w-xs rounded-xl border px-4 py-3 shadow-lg ${
              isDark
                ? "border-amber-900/60 bg-[#080603]/95 text-amber-300"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>

              <div>
                <p className="text-sm font-bold">
                  Login Required
                </p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    isDark
                      ? "text-amber-400"
                      : "text-amber-700"
                  }`}
                >
                  Please log in to use weather-aware routing.
                </p>
              </div>
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
          className="!h-full !w-full"
          center={[-37.8136, 144.9631]}
          zoom={13}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <BoundsWatcher onChange={setBbox} />

          <MapClickHandler
            onLocationSelect={handleLocationSelect}
          />

          {originLocation?.lat && originLocation?.lon && (
            <Marker
              position={[
                originLocation.lat,
                originLocation.lon,
              ]}
            />
          )}

          {destinationLocation?.lat &&
            destinationLocation?.lon && (
              <Marker
                position={[
                  destinationLocation.lat,
                  destinationLocation.lon,
                ]}
              />
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
          <TurnByTurnOverlay
            steps={weatherResult.steps}
            isDark={isDark}
          />
        )}

        {weatherResult && (
          <div className="absolute bottom-5 right-5 z-[1000] w-[420px] max-w-[calc(100%-2rem)] sm:bottom-20 sm:right-6">
            <WeatherAwareResult
              result={weatherResult}
              isDark={isDark}
            />
          </div>
        )}

        <button
          type="button"
          aria-label="Toggle dark mode"
          title={
            isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          onClick={() => setIsDark((prev) => !prev)}
          className={`absolute bottom-5 left-5 z-[1200] flex h-11 w-11 items-center justify-center rounded-full border text-lg shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
            isDark
              ? "border-emerald-900/60 bg-[#050806] text-white hover:bg-[#08100c] focus:ring-offset-black"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-offset-white"
          }`}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>
    </div>
  );
}