import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

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
      className="
        absolute right-4 top-4 z-[1000] w-[360px] max-w-[calc(100%-2rem)] rounded-2xl border p-5 shadow-xl backdrop-blur-sm
        border-surface-200 bg-background/95 text-surface-900
        dark:border-emerald-900/60 dark:shadow-emerald-950/30"
    >
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Route Planning
          </span>
        </div>

        <h3
          className="text-xl font-extrabold text-surface-900"
        >
          Weather-Aware Routing
        </h3>

        <p className="mt-1 text-xs leading-5 text-surface-500">
          Enter your journey details to calculate energy requirements based
          on weather and route conditions.
        </p>
      </div>

      <div className="mb-4">
        <label
          htmlFor="weather-origin"
          className="mb-1.5 block text-sm font-bold text-surface-700"
        >
          Origin
        </label>

        <input
          id="weather-origin"
          ref={originInputRef}
          type="text"
          placeholder="Type origin or click map"
          onFocus={() => setActiveField("origin")}
          className="
            w-full rounded-xl border px-3 py-3 text-sm font-semibold outline-none transition
            border-surface-300 placeholder:text-surface-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
            dark:border-emerald-900/60 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20
          "
        />

        {activeField === "origin" && !originLocation?.address && (
          <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            Type an origin or click the map to fill origin
          </div>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="weather-destination"
          className="mb-1.5 block text-sm font-bold text-surface-700"
        >
          Destination
        </label>

        <input
          id="weather-destination"
          ref={destinationInputRef}
          type="text"
          placeholder="Type destination or click map"
          onFocus={() => setActiveField("destination")}
          className="
            w-full rounded-xl border px-3 py-3 text-sm font-semibold outline-none transition
            border-surface-300 placeholder:text-surface-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
            dark:border-emerald-900/60 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20
          "
        />

        {activeField === "destination" &&
          !destinationLocation?.address && (
            <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              Type a destination or click the map to fill destination
            </div>
          )}
      </div>

      <div
        className="mb-4 flex items-center justify-between rounded-xl border p-3 dark:border-emerald-900/60 border-surface-200 bg-surface-50"
      >
        <div>
          <p
            className="text-sm font-bold text-surface-700"
          >
            Air Conditioning
          </p>

          <p
            className="mt-0.5 text-xs text-surface-500"
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

          <div className="h-6 w-11 rounded-full bg-surface-300 transition peer-checked:bg-emerald-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30 dark:bg-surface-700" />

          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <div
        className={`mb-4 text-right text-xs font-semibold ${
          isDark ? "text-surface-400" : "text-surface-500"
        }`}
      >
        AC:{" "}
        <span className={acOn ? "text-emerald-600 dark:text-emerald-400" : "text-surface-400"}>
          {acOn ? "On" : "Off"}
        </span>
      </div>

      {weatherError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
          {weatherError}
        </div>
      )}

      <Button
        type="button"
        variant="primary"
        onClick={onClick}
        loading={weatherLoading}
        loadingLabel="Calculating..."
        className="w-full"
      >
        Calculate Energy
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="mt-2 w-full"
        onClick={handleLocalReset}
      >
        Reset
      </Button>
    </div>
  );
}