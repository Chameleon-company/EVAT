import { useState } from "react";
import ChargingRecommendationCard from "./ChargingRecommendationCard";
import {
  getChargingRecommendations,
  selectChargingStation,
} from "../services/chargingRecommendationService.js";

function ChargingRecommendations() {
  /* const mockRecommendations = [
    {
      rank: 1,
      stationId: "station-001",
      operator: "Chargefox",
      latitude: -37.8142,
      longitude: 144.9618,
      connectionType: "Type 2",
      currentType: "DC",
      chargingPoints: 4,
      cost: "$0.40/kWh",
      distanceKm: 1.8,
      reasons: [
        "Low station congestion",
        "Low energy required to reach",
        "Nearby station",
      ],
    },
    {
      rank: 2,
      stationId: "station-002",
      operator: "Evie Networks",
      latitude: -37.8185,
      longitude: 144.9701,
      connectionType: "CCS2",
      currentType: "DC",
      chargingPoints: 6,
      cost: "$0.45/kWh",
      distanceKm: 2.4,
      reasons: [
        "Multiple charging points available",
        "Fast charging supported",
        "Good distance from current location",
      ],
    },
    {
      rank: 3,
      stationId: "station-003",
      operator: "Ampol AmpCharge",
      latitude: -37.821,
      longitude: 144.955,
      connectionType: "CCS2",
      currentType: "DC",
      chargingPoints: 3,
      cost: "$0.42/kWh",
      distanceKm: 3.1,
      reasons: [
        "Reliable charging location",
        "Fast charging available",
        "Alternative nearby station",
      ],
    },
    {
      rank: 4,
      stationId: "station-004",
      operator: "AmpCharge",
      latitude: -37.81,
      longitude: 144.95,
      connectionType: "CCS4",
      currentType: "DC",
      chargingPoints: 4,
      cost: "$0.42/kWh",
      distanceKm: 3.1,
      reasons: [
        "Reliable charging location",
        "Fast charging available",
        "Alternative nearby station",
      ],
    },
  ];

  const [recommendations, setRecommendations] =
    useState(mockRecommendations);
  */

  const [recommendations, setRecommendations] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleGetRecommendations = () => {
    setLoading(true);
    setError("");
    setHasSearched(false);
    setRecommendations([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await getChargingRecommendations(
            latitude,
            longitude
          );

          const data = response.data || {};

          setRecommendations(data.recommendations || []);
          setSessionId(data.sessionId || null);
          setHasSearched(true);
        } catch (err) {
          setError(
            "Unable to get charging recommendations."
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Unable to access your location.");
        setLoading(false);
      }
    );
  };

  const handleSelectStation = async (station) => {
    try {
      await selectChargingStation(
        sessionId,
        station.stationId
      );

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

      window.open(mapsUrl, "_blank");
    } catch (err) {
      setError(
        "Unable to select charging station."
      );
    }
  };

  return (
    <div
      className={`
        absolute
        z-[1500]
        overflow-y-auto
        overflow-x-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white/95
        p-[18px]
        text-slate-900
        shadow-[0_14px_35px_rgba(0,0,0,0.20)]
        backdrop-blur-xl
        transition-all
        duration-300
        ease-out

        dark:border-emerald-900/60
        dark:bg-[#08140f]/95
        dark:text-white
        dark:shadow-[0_14px_35px_rgba(0,0,0,0.45)]

        max-[768px]:left-[10px]
        max-[768px]:right-[75px]
        max-[768px]:top-[65px]
        max-[768px]:max-h-[65vh]
        max-[768px]:w-auto
        max-[768px]:max-w-none
        max-[768px]:rounded-[14px]

        max-[480px]:left-[10px]
        max-[480px]:right-[75px]
        max-[480px]:top-[65px]
        max-[480px]:max-h-[65vh]

        min-[769px]:right-[75px]
        min-[769px]:top-[105px]
        min-[769px]:w-[330px]
        min-[769px]:max-w-[calc(100vw-150px)]
        min-[769px]:max-h-[calc(100vh-145px)]

        min-[1400px]:right-[100px]
        min-[1400px]:w-[350px]

        ${
          isMinimized
            ? `
              min-[769px]:w-[300px]
              min-[769px]:p-[13px_15px]
              max-[480px]:w-[330px]
              max-[480px]:max-w-[calc(100vw-85px)]
            `
            : ""
        }
      `}
    >
      {/* Header */}
      <div
        className={`
          mb-[2px]
          flex
          items-start
          justify-between
          gap-3

          ${
            isMinimized
              ? "items-center"
              : ""
          }
        `}
      >
        <div className="min-w-0">
          <h2
            className={`
              m-0
              text-xl
              font-bold
              leading-tight
              text-slate-900

              dark:text-white

              ${
                isMinimized
                  ? "text-[15px]"
                  : ""
              }
            `}
          >
            ⚡ Charging Recommendations
          </h2>

          {!isMinimized && (
            <p
              className="
                mb-[10px]
                mt-[6px]
                text-xs
                leading-[1.45]
                text-slate-600

                dark:text-white/70
              "
            >
              Find the best charging stations near your
              current location.
            </p>
          )}
        </div>

        {/* Minimize button */}
        <button
          type="button"
          className="
            flex
            h-[30px]
            w-[30px]
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-slate-300
            bg-transparent
            p-0
            text-lg
            leading-none
            text-slate-800
            transition-all
            duration-200
            hover:scale-[1.04]
            hover:border-emerald-500
            hover:bg-emerald-50

            dark:border-white/20
            dark:text-white
            dark:hover:border-emerald-400
            dark:hover:bg-emerald-400/15
          "
          onClick={() =>
            setIsMinimized(!isMinimized)
          }
          aria-label={
            isMinimized
              ? "Expand recommendations"
              : "Minimize recommendations"
          }
        >
          {isMinimized ? "+" : "−"}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Find stations button */}
          <button
            type="button"
            className="
              mt-[10px]
              w-full
              rounded-[9px]
              border
              border-emerald-500
              bg-emerald-400
              px-4
              py-[10px]
              text-[13px]
              font-bold
              text-emerald-950
              transition-all
              duration-200

              hover:-translate-y-px
              hover:bg-emerald-300
              hover:shadow-[0_6px_18px_rgba(0,0,0,0.20)]

              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-emerald-500

              disabled:cursor-not-allowed
              disabled:opacity-50

              dark:bg-[#2dd37e]
              dark:text-[#07140e]
              dark:hover:bg-[#3be58b]
              dark:focus-visible:outline-white
            "
            onClick={handleGetRecommendations}
            disabled={loading}
          >
            {loading
              ? "Finding stations..."
              : "Find Charging Stations"}
          </button>

          {/* Error */}
          {error && (
            <p
              className="
                mb-0
                mt-[10px]
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-[11px]
                py-[9px]
                text-xs
                leading-[1.4]
                text-red-700

                dark:border-red-400/30
                dark:bg-red-500/10
                dark:text-red-300
              "
            >
              {error}
            </p>
          )}

          {/* Empty state */}
          {hasSearched &&
            !loading &&
            !error &&
            recommendations.length === 0 && (
              <p
                className="
                  mb-[3px]
                  mt-[10px]
                  rounded-lg
                  border
                  border-slate-200
                  bg-slate-100
                  px-3
                  py-3
                  text-center
                  text-xs
                  leading-[1.5]
                  text-slate-500

                  dark:border-white/10
                  dark:bg-white/[0.04]
                  dark:text-white/60
                "
              >
                No charging recommendation found near
                your location.
              </p>
            )}

          {/* Recommendation list */}
          <div className="mt-[10px]">
            {recommendations.map((station) => (
              <div
                key={station.stationId}
                className="
                  mt-[10px]
                  rounded-[11px]
                  border
                  border-slate-200
                  bg-white
                  p-[13px]
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-emerald-400
                  hover:shadow-[0_7px_18px_rgba(0,0,0,0.12)]

                  dark:border-white/[0.18]
                  dark:bg-black/95
                  dark:hover:border-emerald-400/70
                  dark:hover:shadow-[0_7px_18px_rgba(0,0,0,0.28)]
                "
              >
                <ChargingRecommendationCard
                  station={station}
                  onSelect={handleSelectStation}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ChargingRecommendations;