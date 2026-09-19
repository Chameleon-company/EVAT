import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "./user";
import { getNearbyPlaces, getPlacesForStation } from "../services/nearbyPlaceService";

export const NearbyPlacesContext = createContext({
  station: null,
  places: [],
  loading: false,
  error: "",
  category: "all",
  setCategory: () => {},
});

function stationCoords(station) {
  const latitude = Number(station?.latitude ?? station?.location?.coordinates?.[1]);
  const longitude = Number(station?.longitude ?? station?.location?.coordinates?.[0]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude };
}

function stationKey(station) {
  if (!station) return null;
  return station._id || `${station.latitude},${station.longitude}`;
}

/**
 * Single shared Places fetch for sidebar + map markers.
 * Category changes refetch with that Google includedTypes list (not a client-only filter of "all").
 */
export function NearbyPlacesProvider({ station, children }) {
  const { user } = useContext(UserContext);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const selectedStationKey = stationKey(station);
  const [categoryStationKey, setCategoryStationKey] = useState(selectedStationKey);

  // Reset category synchronously when the selected charger changes so we don't
  // briefly fetch the previous category for the new station.
  if (selectedStationKey !== categoryStationKey) {
    setCategoryStationKey(selectedStationKey);
    setCategory("all");
  }

  useEffect(() => {
    if (!station || !user) {
      setPlaces([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const abortController = new AbortController();
    let cancelled = false;

    // Clear previous charger/category markers immediately so the map is not
    // paired with stale directions while the next request is in flight.
    setPlaces([]);
    setLoading(true);
    setError("");

    const loadPlaces = async () => {
      try {
        const options = {
          category,
          radiusKm: 1,
          signal: abortController.signal,
        };

        let response;
        if (station._id) {
          response = await getPlacesForStation(station._id, options);
        } else {
          const coords = stationCoords(station);
          if (!coords) {
            throw new Error("This station has no location data.");
          }
          response = await getNearbyPlaces(coords.latitude, coords.longitude, options);
        }

        if (cancelled) return;
        setPlaces(response.data?.places || []);
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        setPlaces([]);
        setError(err.message || "Unable to load nearby places.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPlaces();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [station, selectedStationKey, category]);

  const value = useMemo(
    () => ({ station, places, loading, error, category, setCategory }),
    [station, places, loading, error, category]
  );

  return (
    <NearbyPlacesContext.Provider value={value}>
      {children}
    </NearbyPlacesContext.Provider>
  );
}

export function useNearbyPlaces() {
  return useContext(NearbyPlacesContext);
}
