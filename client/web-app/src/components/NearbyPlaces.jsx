import React, { useContext, useEffect, useState } from "react";
import { MapPin, Store, ExternalLink } from "lucide-react";
import { UserContext } from "../context/user";
import {
  getNearbyPlaces,
  getPlacesForStation,
  fetchPlacePhotoObjectUrl,
} from "../services/nearbyPlaceService";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "shopping", label: "Shopping" },
];

const CATEGORY_EMOJI = {
  food: "🍽️",
  shopping: "🛍️",
};

function formatDistance(place) {
  if (place.distanceMeters == null) return "Nearby";
  if (place.distanceMeters < 1000) return `${place.distanceMeters} m`;
  return `${(place.distanceMeters / 1000).toFixed(1)} km`;
}

function PlacePhoto({ place, token }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!place.photoName) {
      setSrc(null);
      setFailed(true);
      return undefined;
    }

    const abortController = new AbortController();
    let objectUrl;
    let cancelled = false;

    setFailed(false);
    setSrc(null);

    fetchPlacePhotoObjectUrl(place.photoName, { token, signal: abortController.signal })
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setFailed(true);
      });

    return () => {
      cancelled = true;
      abortController.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [place.photoName, token]);

  if (!src || failed) {
    return (
      <div className="promo-photo promo-photo-placeholder" aria-hidden="true">
        {CATEGORY_EMOJI[place.category] || "📍"}
      </div>
    );
  }

  return (
    <img
      className="promo-photo"
      src={src}
      alt={place.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function NearbyPlaces({ station }) {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!station) {
      setPlaces([]);
      return undefined;
    }

    const abortController = new AbortController();
    let cancelled = false;

    const loadPlaces = async () => {
      setLoading(true);
      setError("");
      try {
        const options = { category, token, signal: abortController.signal };
        let response;

        if (station._id) {
          response = await getPlacesForStation(station._id, options);
        } else {
          const latitude = Number(station.latitude ?? station.location?.coordinates?.[1]);
          const longitude = Number(station.longitude ?? station.location?.coordinates?.[0]);
          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            throw new Error("This station has no location data.");
          }
          response = await getNearbyPlaces(latitude, longitude, options);
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
  }, [station, category, token]);

  return (
    <div>
      <div className="sidebar-linebreak" />
      <button
        type="button"
        className="promo-section-toggle"
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="promo-section-title">
          <Store size={16} />
          Nearby Food & Stores
        </span>
        <span className="text-tiny">
          {expanded ? "Hide" : `${places.length || ""} Show`}
        </span>
      </button>

      {expanded && (
        <>
          <p className="text-tiny promo-section-hint">
            Live places within walking distance. Directions start from this charger.
          </p>

          <div className="promo-category-row">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`promo-chip ${category === item.id ? "active" : ""}`}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading && <div className="font-italic text-small">Finding nearby places...</div>}
          {!loading && error && <div className="font-italic text-small">{error}</div>}
          {!loading && !error && places.length === 0 && (
            <div className="font-italic text-small">
              No restaurants or stores found within walking distance of this charger.
            </div>
          )}

          {!loading &&
            places.map((place) => (
              <div key={place.id} className="promo-card">
                <PlacePhoto place={place} token={token} />
                <div className="promo-card-header">
                  <span className="promo-emoji">
                    {CATEGORY_EMOJI[place.category] || "📍"}
                  </span>
                  <div className="promo-card-copy">
                    <div className="promo-business">{place.typeLabel}</div>
                    <div className="promo-title">{place.name}</div>
                  </div>
                  {place.rating != null && (
                    <span className="promo-discount">{place.rating.toFixed(1)} ★</span>
                  )}
                </div>

                {place.address && (
                  <p className="text-small promo-description">{place.address}</p>
                )}

                <div className="promo-meta">
                  <span className="text-tiny promo-distance">
                    <MapPin size={12} />
                    {formatDistance(place)}
                    {place.walkingMinutes ? ` · ${place.walkingMinutes} min walk` : ""}
                    {place.isOpen === true ? " · Open" : ""}
                    {place.isOpen === false ? " · Closed" : ""}
                  </span>
                  {place.directionsUrl && (
                    <a
                      className="promo-code-btn"
                      href={place.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={12} />
                      Directions
                    </a>
                  )}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
