import { useState } from "react";
import ChargingRecommendationCard from "./ChargingRecommendationCard";  
import { 
  getChargingRecommendations, 
  selectChargingStation,
} from "../services/chargingRecommendationService.js";
import "../styles/ChargingRecommendations.css";
import { Banner } from "./Banner.js";
import { XIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "./Button.js";
import clsx from "clsx";

// TODO: TypeScript typings for Station.
type Station = unknown;


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
]  
*/ 
  /*  const [recommendations, setRecommendations] = useState(mockRecommendations); /* For using the mock data present up  */  
  const [recommendations, setRecommendations] = useState<Station[]>([]); 
  const [sessionId, setSessionId] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
    
  const _getCurrentPos = () => new Promise(
    (res, rej) => navigator.geolocation.getCurrentPosition(res, rej),
  );

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError('');
    setHasSearched(false);
    setRecommendations([]);

    try {
      const position = await _getCurrentPos();
      try {
        const { latitude, longitude } = position.coords;

        const response = await getChargingRecommendations(latitude, longitude);
        const data = response.data || {};

        setRecommendations(data.recommendations || []);
        setSessionId(data.sessionId || null);
        setHasSearched(true);
      }
      catch (err) {
        console.log(err);
        setError('Unable to get charging recommendations.');
      }
      finally {
        setLoading(false);
      }
    }
    catch (err) {
      setError('Unable to access your location.');
      setLoading(false);
    }
  };  

  const handleSelectStation = async (station: Station) => {
    try {
      if (!sessionId) return;
      await selectChargingStation(sessionId, station.stationId);

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

      window.open(mapsUrl, "_blank");
    }
    catch (err) {
      setError("Unable to select charging station.");
    }
  };

  return (
    <div
      className={twMerge(
        'absolute bg-background/80 rounded-t-xl bottom-0 inset-x-0 p-4 z-12 w-full backdrop-blur max-h-1/2 overflow-x-hidden overflow-y-auto',
        '[&::-webkit-scrollbar]:w-2 [%::-webkit-scrollbar-track]:rounded-md',
        '[&::-webkit-scrollbar-thumb]:bg-foreground [&::-webkit-scrollbar-thumb]:rounded-md',
        '[&::-webkit-scrollbar-thumb:hover]:bg-emerald-700',
        'md:inset-x-auto md:max-w-sm md:bottom-[unset] md:top-2 md:right-4 md:rounded-xl xl:top-4',
      )}
    >
      <div className={twMerge(clsx('flex justify-between gap-x-2 text-error', !isMinimized && 'mb-4'))}>
        <h2 className="font-semibold mt-px">⚡Charging Recommendations</h2>

        <button
          className="
            flex items-center justify-center size-6
            rounded-md
            cursor-pointer
            outline-1 outline-primary/25
            hover:bg-primary/25
          "
          variant="unstyled"
          onClick={() => setIsMinimized(!isMinimized)}
          aria-label={isMinimized ? "Expand recommendations" : "Minimize recommendations"}
        >
          {isMinimized ? "+" : "−"}
        </button>
      </div>

      {!isMinimized && (
        <>
          <p className="text-sm/6">
            Find the best charging stations near your current location.
          </p>
          <Button
            className='mt-4 w-full rounded-md!'
            onClick={handleGetRecommendations}
            disabled={loading}
          >
            {loading ? "Finding stations..." : "Find Charging Stations"}
          </Button>

          {error && (
            <>
              <Banner
                className="text-red-50 mt-3 w-full pb-1.5! pt-2! px-2.5! rounded-md! [&>div]:leading-none"
                type="error"
                variant="outline"
              >
                <span class="text-xs text-red-700 inline-flex items-center justify-center gap-x-1 dark:text-red-300">
                  <XIcon className="size-4" />
                  {error}
                </span>
              </Banner>
            </>
          )
          }

          {hasSearched && !loading && !error && recommendations.length === 0 && (
            <p className="recommendations-empty">
              no charging recommendation found near your location.
            </p>  
          )}

          <div className="recommendations-list">
            {recommendations.map((station) => (
              <ChargingRecommendationCard
                key={station.stationId}
                station={station}
                onSelect={handleSelectStation}
              />
            ))}
          </div>
        </>
      )}
    </div>
)
};

export default ChargingRecommendations;
