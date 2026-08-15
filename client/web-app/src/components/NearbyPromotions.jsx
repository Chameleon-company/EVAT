import React, { useEffect, useState } from "react";
import { Copy, Check, MapPin, Tag } from "lucide-react";
import { toast } from "react-toastify";
import { getNearbyPromotions, getPromotionsForStation } from "../services/promotionService";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee" },
  { id: "food", label: "Food" },
  { id: "shopping", label: "Shopping" },
  { id: "entertainment", label: "Fun" },
  { id: "services", label: "Services" },
];

const CATEGORY_EMOJI = {
  coffee: "☕",
  food: "🍽️",
  shopping: "🛍️",
  entertainment: "🎟️",
  services: "🛠️",
};

function formatDistance(promo) {
  if (promo.distanceMeters == null) return "Nearby";
  if (promo.distanceMeters < 1000) return `${promo.distanceMeters} m`;
  return `${(promo.distanceMeters / 1000).toFixed(1)} km`;
}

export default function NearbyPromotions({ station }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [copiedCode, setCopiedCode] = useState("");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!station) return;

    const loadPromotions = async () => {
      setLoading(true);
      setError("");
      try {
        const options = { category };
        let response;

        if (station._id) {
          response = await getPromotionsForStation(station._id, options);
        } else {
          const latitude = Number(station.latitude ?? station.location?.coordinates?.[1]);
          const longitude = Number(station.longitude ?? station.location?.coordinates?.[0]);
          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            throw new Error("This station has no location data.");
          }
          response = await getNearbyPromotions(latitude, longitude, options);
        }

        setPromotions(response.data?.promotions || []);
      } catch (err) {
        setPromotions([]);
        setError(err.message || "Unable to load nearby offers.");
      } finally {
        setLoading(false);
      }
    };

    loadPromotions();
  }, [station, category]);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Copied ${code}`);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch {
      toast.error("Could not copy promo code");
    }
  };

  return (
    <div>
      <div className="sidebar-linebreak" />
      <button
        type="button"
        className="promo-section-toggle"
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="promo-section-title">
          <Tag size={16} />
          Offers Near This Charger
        </span>
        <span className="text-tiny">
          {expanded ? "Hide" : `${promotions.length || ""} Show`}
        </span>
      </button>

      {expanded && (
        <>
          <p className="text-tiny promo-section-hint">
            Use these partner deals while your vehicle charges.
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

          {loading && <div className="font-italic text-small">Finding nearby offers...</div>}
          {!loading && error && <div className="font-italic text-small">{error}</div>}
          {!loading && !error && promotions.length === 0 && (
            <div className="font-italic text-small">
              No offers within walking distance of this charger yet.
            </div>
          )}

          {!loading &&
            promotions.map((promo) => (
              <div key={promo.id} className="promo-card">
                <div className="promo-card-header">
                  <span className="promo-emoji">
                    {CATEGORY_EMOJI[promo.category] || "🏷️"}
                  </span>
                  <div className="promo-card-copy">
                    <div className="promo-business">{promo.businessName}</div>
                    <div className="promo-title">{promo.title}</div>
                  </div>
                  <span className="promo-discount">{promo.discountLabel}</span>
                </div>

                {promo.description && (
                  <p className="text-small promo-description">{promo.description}</p>
                )}

                <div className="promo-meta">
                  <span className="text-tiny promo-distance">
                    <MapPin size={12} />
                    {formatDistance(promo)}
                    {promo.walkingMinutes ? ` · ${promo.walkingMinutes} min walk` : ""}
                  </span>
                  {promo.promoCode && (
                    <button
                      type="button"
                      className="promo-code-btn"
                      onClick={() => copyCode(promo.promoCode)}
                    >
                      {copiedCode === promo.promoCode ? <Check size={12} /> : <Copy size={12} />}
                      {promo.promoCode}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
