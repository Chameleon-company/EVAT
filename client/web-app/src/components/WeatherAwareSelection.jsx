import React, { useEffect, useRef, useState } from "react";

export default function WeatherAwareSelection({
  originLocation,
  destinationLocation,
  activeField,
  setActiveField,
  acOn,
  setAcOn,
  weatherError,
  weatherLoading,
  onClick,
  handleReset,
  isDark,
  onPlaceSelect,
}) {
  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Load Google Maps + Places script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.log("Google Maps API key is missing.");
      return;
    }

    if (window.google?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setGoogleLoaded(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setGoogleLoaded(true);
    };

    script.onerror = () => {
      console.log("Failed to load Google Maps script.");
    };

    document.body.appendChild(script);
  }, []);

  // Attach Google Places autocomplete
  useEffect(() => {
    if (!googleLoaded) return;

    if (!originInputRef.current || !destinationInputRef.current) return;

    if (!window.google?.maps?.places?.Autocomplete) {
      console.log("Google Places Autocomplete is not available.");
      return;
    }

    const originAutocomplete =
      new window.google.maps.places.Autocomplete(
        originInputRef.current,
        {
          fields: ["formatted_address", "name", "geometry"],
          componentRestrictions: { country: "au" },
        }
      );

    const destinationAutocomplete =
      new window.google.maps.places.Autocomplete(
        destinationInputRef.current,
        {
          fields: ["formatted_address", "name", "geometry"],
          componentRestrictions: { country: "au" },
        }
      );

    originAutocomplete.addListener("place_changed", () => {
      const place = originAutocomplete.getPlace();
      handleGooglePlace("origin", place);
    });

    destinationAutocomplete.addListener("place_changed", () => {
      const place = destinationAutocomplete.getPlace();
      handleGooglePlace("destination", place);
    });
  }, [googleLoaded]);

  // Sync map selections with input fields
  useEffect(() => {
    if (originInputRef.current && originLocation?.address) {
      originInputRef.current.value = originLocation.address;
    }
  }, [originLocation]);

  useEffect(() => {
    if (destinationInputRef.current && destinationLocation?.address) {
      destinationInputRef.current.value = destinationLocation.address;
    }
  }, [destinationLocation]);

  const handleGooglePlace = (fieldName, place) => {
    if (!place || !place.geometry) return;

    const selectedPlace = {
      address: place.formatted_address || place.name,
      lat: place.geometry.location.lat(),
      lon: place.geometry.location.lng(),
    };

    onPlaceSelect(fieldName, selectedPlace);
  };

  const handleLocalReset = () => {
    if (originInputRef.current) {
      originInputRef.current.value = "";
    }

    if (destinationInputRef.current) {
      destinationInputRef.current.value = "";
    }

    handleReset();
  };

  return (
    <div
      className={`absolute left-4 top-4 z-[1000] w-[360px] max-w-[calc(100%-2rem)] rounded-2xl border p-5 shadow-xl backdrop-blur-sm ${
        isDark
          ? "border-slate-700 bg-slate-900/95 text-white"
          : "border-slate-200 bg-white/95 text-slate-900"
      }`}
    >
      {/* Header */}
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Route Planning
          </span>
        </div>

        <h3
          className={`text-xl font-extrabold ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Weather-Aware Routing
        </h3>

        <p
          className={`mt-1 text-xs leading-5 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Enter your journey details to calculate energy requirements based
          on weather and route conditions.
        </p>
      </div>

      {/* Origin */}
      <div className="mb-4">
        <label
          htmlFor="weather-origin"
          className={`mb-1.5 block text-sm font-bold ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          Origin
        </label>

        <input
          id="weather-origin"
          ref={originInputRef}
          type="text"
          placeholder="Type origin or click map"
          onFocus={() => setActiveField("origin")}
          className={`w-full rounded-xl border px-3 py-3 text-sm font-semibold outline-none transition ${
            isDark
              ? "border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              : "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          }`}
        />

        {activeField === "origin" && !originLocation?.address && (
          <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
            Type an origin or click the map to fill origin
          </div>
        )}
      </div>

      {/* Destination */}
      <div className="mb-4">
        <label
          htmlFor="weather-destination"
          className={`mb-1.5 block text-sm font-bold ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          Destination
        </label>

        <input
          id="weather-destination"
          ref={destinationInputRef}
          type="text"
          placeholder="Type destination or click map"
          onFocus={() => setActiveField("destination")}
          className={`w-full rounded-xl border px-3 py-3 text-sm font-semibold outline-none transition ${
            isDark
              ? "border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              : "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          }`}
        />

        {activeField === "destination" &&
          !destinationLocation?.address && (
            <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
              Type a destination or click the map to fill destination
            </div>
          )}
      </div>

      {/* Air Conditioning Toggle */}
      <div
        className={`mb-4 flex items-center justify-between rounded-xl border p-3 ${
          isDark
            ? "border-slate-700 bg-slate-800"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div>
          <p
            className={`text-sm font-bold ${
              isDark ? "text-white" : "text-slate-700"
            }`}
          >
            Air Conditioning
          </p>

          <p
            className={`mt-0.5 text-xs ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Include AC energy usage
          </p>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={acOn}
            onChange={(e) => setAcOn(e.target.checked)}
            className="peer sr-only"
          />

          <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30" />

          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <div className="mb-4 text-right text-xs font-semibold text-slate-500">
        AC:{" "}
        <span className={acOn ? "text-emerald-600" : "text-slate-400"}>
          {acOn ? "On" : "Off"}
        </span>
      </div>

      {/* Error */}
      {weatherError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
          {weatherError}
        </div>
      )}

      {/* Calculate */}
      <button
        type="button"
        onClick={onClick}
        disabled={weatherLoading}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {weatherLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Calculating...
          </span>
        ) : (
          "Calculate Energy"
        )}
      </button>

      {/* Reset */}
      <button
        type="button"
        onClick={handleLocalReset}
        className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
          isDark
            ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
        }`}
      >
        Reset
      </button>
    </div>
  );
}