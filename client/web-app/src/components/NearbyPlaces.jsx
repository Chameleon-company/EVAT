import React, { useContext, useEffect, useRef, useState } from "react";
import { MapPin, Store, ExternalLink } from "lucide-react";
import { UserContext } from "../context/user";
import { useNearbyPlaces } from "../context/NearbyPlacesContext";
import { fetchPlacePhotoObjectUrl } from "../services/nearbyPlaceService";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "shopping", label: "Shopping" },
];

const CATEGORY_EMOJI = {
  food: "🍽️",
  shopping: "🛍️",
};

/** Eagerly allow photos for the first N cards; the rest wait until scrolled into view. */
const EAGER_PHOTO_COUNT = 3;

function formatDistance(place) {
  if (place.distanceMeters == null) return "Nearby";
  if (place.distanceMeters < 1000) return `${place.distanceMeters} m`;
  return `${(place.distanceMeters / 1000).toFixed(1)} km`;
}

function PlacePhoto({ place, enabled }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || !place.photoName) {
      setSrc(null);
      setFailed(!place.photoName);
      return undefined;
    }

    const abortController = new AbortController();
    let objectUrl;
    let cancelled = false;

    setFailed(false);
    setSrc(null);

    fetchPlacePhotoObjectUrl(place.photoName, { signal: abortController.signal })
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
  }, [place.photoName, enabled]);

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

function PlaceCard({ place, eager }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(Boolean(eager));

  useEffect(() => {
    if (eager || visible) return undefined;
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "120px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, visible]);

  return (
    <div ref={cardRef} className="promo-card">
      <PlacePhoto place={place} enabled={visible} />
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
  );
}

export default function NearbyPlaces() {
  const { user } = useContext(UserContext);
  const { places, loading, error, category, setCategory } = useNearbyPlaces();
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h6 class="font-bold flex items-center gap-x-2">
          <Store size={16} />
          Nearby Food & Stores
        </h6>
        
        <button
          className="
            flex items-center justify-center size-6
            rounded-md
            cursor-pointer
            outline-1 outline-primary/25
            hover:bg-primary/25
          "
          onClick={() => setExpanded(!expanded)}
          aria-label={open ? "Expand nearby places" : "Minimize nearby places"}
        >
          {expanded ? "-" : "+"}
        </button>
      </div>

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
            places.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                eager={index < EAGER_PHOTO_COUNT}
              />
            ))}
        </>
      )}
    </div>
  );
}
