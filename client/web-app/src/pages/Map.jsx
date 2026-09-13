import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import { UserContext } from '../context/user';
import { FavouritesContext } from '../context/FavouritesContext';
import { useTheme } from '../context/ThemeContext';
import {
  getChargers,
  getConnectorTypes,
  getOperatorTypes,
} from '../services/chargerService';
import NavBar from '../components/NavBar';
import LocateUser from '../components/LocateUser';
import ClusterMarkers from '../components/ClusterMarkers';
import SmartFilter from '../components/SmartFilter';
import ChatBubble from "../components/ChatBubble";
import ChargerSideBar from '../components/ChargerSideBar';
import FloatingVoiceAssistant from '../components/FloatingVoiceAssistant';
import ChargingRecommendations from '../components/ChargingRecommendations';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const mapThemeStyles = `
  .evat-dark-map-tiles {
    filter: invert(1) hue-rotate(180deg) brightness(0.78) contrast(1.08) saturate(0.75);
  }
`;

function parseCost(costStr) {
  if (!costStr || typeof costStr !== "string") {
    return null;
  }

  const lower = costStr.toLowerCase().trim();

  if (lower.includes("free")) return 0;

  const centsMatch = lower.match(/([\d.]+)\\s*(c|cent|cents)\\b/);

  if (centsMatch) {
    return parseInt(centsMatch[1], 10);
  }

  const dollarMatch = lower.match(/\\$([\\d.]+)/);

  if (dollarMatch) {
    const dollars = parseFloat(dollarMatch[1]);
    return Math.round(dollars * 100);
  }

  const numMatch = lower.match(/([\\d.]+)/);

  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return null;
}

function normaliseOperatorName(name) {
  if (!name) return "Unknown";

  const lower = name.toLowerCase().trim();

  if (lower.includes("tesla")) {
    return "Tesla";
  }

  if (lower.includes("evie")) {
    return "Evie";
  }

  if (lower.includes("pulse")) {
    return "BP Pulse";
  }

  if (lower.includes("ampcharge")) {
    return "Ampol Ampcharge";
  }

  if (lower.includes("nrma")) {
    return "NRMA";
  }

  if (lower.includes("unknown")) {
    return "Unknown";
  }

  return name;
}

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

export default function Map() {
  const { user } = useContext(UserContext);
  const { theme } = useTheme();
  const location = useLocation();

  const isDark = theme === 'dark';

  const priceMin = 0;
  const priceMax = 100;

  const [filters, setFilters] = useState({
    chargerType: [],
    chargingSpeed: [],
    priceRange: [priceMin, priceMax],
    operatorType: [],
    showOnlyAvailable: false,
    showCongestion: true,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [bbox, setBbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const mapRef = useRef(null);

  const handleVoiceResult = (data) => {
    if (!stations.length) return;

    const intent = data?.intent;

    const getLat = (st) =>
      Number(st.latitude ?? st.location?.coordinates?.[1]);

    const getLng = (st) =>
      Number(st.longitude ?? st.location?.coordinates?.[0]);

    const availableStations = stations.filter(
      (st) => st.is_operational === 'true'
    );

    if (intent === 'find_low_cost_station') {
      const userLat = data?.user_location?.lat;
      const userLng = data?.user_location?.lng;

      const centerLat =
        userLat ?? (bbox ? (bbox[1] + bbox[3]) / 2 : -37.8136);

      const centerLng =
        userLng ?? (bbox ? (bbox[0] + bbox[2]) / 2 : 144.9631);

      const getDistanceKm = (st) => {
        const lat = getLat(st);
        const lng = getLng(st);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          return Infinity;
        }

        const R = 6371;
        const dLat = ((lat - centerLat) * Math.PI) / 180;
        const dLng = ((lng - centerLng) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;

        return (
          R *
          2 *
          Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        );
      };

      const cheapest = stations
        .filter((st) => parseCost(st.cost) !== null)
        .filter((st) => getDistanceKm(st) <= 20)
        .sort(
          (a, b) => parseCost(a.cost) - parseCost(b.cost)
        )[0];

      if (cheapest) {
        setSelectedStation(cheapest);
      }

      return;
    }

    if (intent === 'find_nearest_station') {
      const userLat = data?.user_location?.lat;
      const userLng = data?.user_location?.lng;

      const centerLat =
        userLat ?? (bbox ? (bbox[1] + bbox[3]) / 2 : -37.8136);

      const centerLng =
        userLng ?? (bbox ? (bbox[0] + bbox[2]) / 2 : 144.9631);

      let nearest = null;
      let minDist = Infinity;

      stations.forEach((st) => {
        const lat = Number(
          st.latitude ?? st.location?.coordinates?.[1]
        );

        const lng = Number(
          st.longitude ?? st.location?.coordinates?.[0]
        );

        if (Number.isNaN(lat) || Number.isNaN(lng)) return;

        const dist =
          (lat - centerLat) ** 2 +
          (lng - centerLng) ** 2;

        if (dist < minDist) {
          minDist = dist;
          nearest = st;
        }
      });

      if (nearest) {
        setSelectedStation(nearest);

        mapRef.current?.flyTo(
          [nearest.latitude, nearest.longitude],
          16
        );
      }

      return;
    }

    if (intent === 'find_low_congestion') {
      const userLat = Number(data?.user_location?.lat);
      const userLng = Number(data?.user_location?.lng);

      const hasUserLocation =
        !Number.isNaN(userLat) && !Number.isNaN(userLng);

      const centerLat = hasUserLocation
        ? userLat
        : bbox
          ? (bbox[1] + bbox[3]) / 2
          : -37.8136;

      const centerLng = hasUserLocation
        ? userLng
        : bbox
          ? (bbox[0] + bbox[2]) / 2
          : 144.9631;

      const getDistanceKm = (st) => {
        const lat = getLat(st);
        const lng = getLng(st);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          return Infinity;
        }

        const R = 6371;
        const dLat = ((lat - centerLat) * Math.PI) / 180;
        const dLng = ((lng - centerLng) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;

        return (
          R *
          2 *
          Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        );
      };

      const nearbyStations = stations
        .map((st) => ({
          ...st,
          distanceKm: getDistanceKm(st),
        }))
        .filter((st) => st.distanceKm <= 20)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const lowCongestionStation =
        nearbyStations.find(
          (st) =>
            String(
              st.congestion_level || st.congestion || ''
            )
              .toLowerCase()
              .includes('low')
        ) || nearbyStations[0];

      if (lowCongestionStation) {
        setSelectedStation(lowCongestionStation);

        mapRef.current?.flyTo(
          [
            Number(lowCongestionStation.latitude),
            Number(lowCongestionStation.longitude),
          ],
          16
        );
      }

      return;
    }

    setSelectedStation(
      availableStations[0] || stations[0]
    );
  };

  const { favourites, toggleFavourite } =
    useContext(FavouritesContext);

  const [connectorTypes, setConnectorTypes] = useState([]);
  const [operatorTypes, setOperatorTypes] = useState([]);

  useEffect(() => {
    let mounted = true;
    let id;

    if (!user?.token) {
      setLoading(false);
      setErr(
        'Please log in to search for charging stations'
      );
      return;
    }

    const load = async () => {
      try {
        setErr('');

        if (!bbox) {
          if (mounted) {
            setLoading(false);
            setErr('');
          }
          return;
        }

        setLoading(true);

        const data = await getChargers(user, { bbox });

        if (mounted) {
          setStations(Array.isArray(data) ? data : []);
          console.log("Stations:", data);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setErr(e.message || 'Failed to load chargers');
          setLoading(false);
        }
      }
    };

    load();
    id = setInterval(load, 15000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [bbox, user?.token]);

  useEffect(() => {
    if (
      location.pathname === '/congestion-prediction' &&
      stations.length > 0 &&
      !selectedStation
    ) {
      const station =
        stations.find(
          (st) => st.is_operational === 'true'
        ) || stations[0];

      setSelectedStation(station);

      const lat = Number(
        station.latitude ??
          station.location?.coordinates?.[1]
      );

      const lng = Number(
        station.longitude ??
          station.location?.coordinates?.[0]
      );

      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        mapRef.current?.flyTo([lat, lng], 16);
      }
    }
  }, [location.pathname, stations]);

  useEffect(() => {
    if (location.pathname !== '/congestion-prediction') {
      setSelectedStation(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;

    async function fetchConnectorTypes() {
      try {
        const types = await getConnectorTypes(user);
        setConnectorTypes(types);
      } catch (err) {
        console.error(
          "Failed to load connector types",
          err
        );
      }
    }

    async function fetchOperatorTypes() {
      try {
        const types = await getOperatorTypes(user);
        setOperatorTypes(types);
      } catch (err) {
        console.error(
          "Failed to load operator types",
          err
        );
      }
    }

    fetchConnectorTypes();
    fetchOperatorTypes();
  }, [user]);

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const {
        connection_type,
        power_output,
        cost,
        operator,
      } = station;

      if (
        filters.chargerType.length > 0 &&
        !filters.chargerType.includes(connection_type)
      ) {
        return false;
      }

      if (filters.chargingSpeed.length > 0) {
        const speed = Number(power_output);

        const ok = filters.chargingSpeed.some((range) => {
          switch (range) {
            case '<7kW':
              return speed < 7;

            case '7-22kW':
              return speed >= 7 && speed <= 22;

            case '22-50kW':
              return speed > 22 && speed <= 50;

            case '50-150kW':
              return speed > 50 && speed <= 150;

            case '150kW-250kW':
              return speed > 150 && speed <= 250;

            case '250kW+':
              return speed > 250;

            default:
              return false;
          }
        });

        if (!ok) return false;
      }

      const price = parseCost(cost);

      if (
        price < filters.priceRange[0] ||
        price > filters.priceRange[1]
      ) {
        return false;
      }

      if (filters.operatorType.length > 0) {
        const normalisedOperator =
          normaliseOperatorName(operator);

        const bigGroups = operatorTypes.filter(
          (op) => op !== "Other"
        );

        const opForFilter = bigGroups.includes(
          normalisedOperator
        )
          ? normalisedOperator
          : "Other";

        if (
          !filters.operatorType.includes(opForFilter)
        ) {
          return false;
        }
      }

      if (
        filters.showOnlyAvailable &&
        station.is_operational !== 'true'
      ) {
        return false;
      }

      return true;
    });
  }, [stations, filters]);

  return (
    <>
      <style>{mapThemeStyles}</style>

      <NavBar />

      <div className="relative isolate h-(--content-height) w-full overflow-hidden bg-slate-100 dark:bg-black">
        <div className="absolute inset-0 z-0 bg-slate-100 dark:bg-black">
          <MapContainer
            className="relative z-0 h-full w-full"
            center={[-37.8136, 144.9631]}
            zoom={13}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              className={
                isDark ? "evat-dark-map-tiles" : ""
              }
            />

            <BoundsWatcher onChange={setBbox} />

            <ClusterMarkers
              showCongestion={filters.showCongestion}
              stations={filteredStations}
              selectedStation={selectedStation}
              onSelectStation={(st) =>
                setSelectedStation(st)
              }
            />

            <LocateUser />
          </MapContainer>
        </div>

        <button
          className="absolute right-4 top-4 z-[1100] rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg transition-all hover:bg-emerald-50 dark:border-emerald-700/60 dark:bg-[#050806] dark:text-white dark:hover:bg-emerald-950/50"
          onClick={() => setIsFilterOpen(true)}
        >
          🔍 Smart Filters
        </button>

        {loading && bbox && (
          <div className="absolute left-4 top-4 z-[1200] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-lg dark:border-emerald-900/60 dark:bg-[#050806] dark:text-slate-200">
            Loading charging stations…
          </div>
        )}

        {err && (
          <div className="absolute left-4 top-4 z-[1200] max-w-[300px] rounded-xl border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-lg dark:border-red-500 dark:bg-red-950/80 dark:text-red-300">
            {err}
          </div>
        )}

        {!bbox && !loading && user?.token && (
          <div className="absolute left-4 top-4 z-[1200] max-w-[320px] rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-lg dark:border-blue-500 dark:bg-blue-950/80 dark:text-blue-300">
            <div className="mb-1 font-semibold">
              📍 Map Loading
            </div>

            <div className="text-[13px] opacity-90">
              Wait for map to load or move/zoom to search
              for chargers
            </div>
          </div>
        )}

        {!user?.token && (
          <div className="absolute left-4 top-4 z-[1200] max-w-[300px] rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-lg dark:border-amber-500 dark:bg-amber-950/80 dark:text-amber-300">
            <div className="mb-1 font-semibold">
              ⚠️ Login Required
            </div>

            <div className="text-[13px] opacity-90">
              Please log in to search for charging stations
            </div>
          </div>
        )}

        <div className="relative z-[1000]">
          <SmartFilter
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filters}
            setFilters={setFilters}
            filteredCount={filteredStations.length}
            priceMin={priceMin}
            priceMax={priceMax}
            connectorTypes={connectorTypes}
            operatorTypes={operatorTypes}
          />
        </div>

        <div className="relative z-[1050]">
          <ChargerSideBar
            station={selectedStation}
            onClose={() => setSelectedStation(null)}
            favourites={favourites}
            toggleFavourite={toggleFavourite}
          />
        </div>

        <div className="relative z-[1000]">
          <ChargingRecommendations />
        </div>

        <div className="relative z-[1100]">
          <FloatingVoiceAssistant
            onQueryResult={handleVoiceResult}
          />
        </div>

        <div className="relative z-[1100]">
          <ChatBubble />
        </div>
      </div>
    </>
  );
}