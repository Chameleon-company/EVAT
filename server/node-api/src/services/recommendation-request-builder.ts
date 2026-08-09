// Step 14: Build the Recommendation ML API request from gathered candidate data

interface RecommendationCandidate {
  stationId: string;
  latitude: number;
  longitude: number;
  operator: string;
  connectionType: string;
  currentType: string;
  chargingPoints: number;
  distanceKm: number | null;
  durationMin: number | null;
  durationInTrafficMin: number | null;
  trafficCondition: string | null;
  energyNeededKwh: number | null;
  congestionLevel: string;
}

interface RecommendationRequestPayload {
  userId: string;
  userLocation: { latitude: number; longitude: number };
  vehicle: {
    vehicleId: string | null;
    make?: string;
    model?: string;
  } | null;
  candidates: RecommendationCandidate[];
}

function buildRecommendationRequest(
  userId: string,
  latitude: number,
  longitude: number,
  stations: any[],
  routingResults: { stationId: string; routing: any }[],
  congestionLevels: any[],
  vehicle: any
): RecommendationRequestPayload {
  const routingByStation = new Map(
    routingResults.map((r) => [r.stationId, r.routing])
  );
  const congestionByStation = new Map(
    congestionLevels.map((c: any) => [c.chargerId.toString(), c.congestion_level])
  );

  const candidates: RecommendationCandidate[] = stations.map((station: any) => {
    const stationId = station._id.toString();
    const routing = routingByStation.get(stationId);
    const congestionLevel = congestionByStation.get(stationId) ?? "unknown";

    return {
      stationId,
      latitude: station.latitude,
      longitude: station.longitude,
      operator: station.operator,
      connectionType: station.connection_type,
      currentType: station.current_type,
      chargingPoints: station.charging_points,
      distanceKm: routing?.distance_km ?? null,
      durationMin: routing?.duration_min ?? null,
      durationInTrafficMin: routing?.duration_in_traffic_min ?? null,
      trafficCondition: routing?.traffic_condition ?? null,
      energyNeededKwh: routing?.energy_with_ac_kwh ?? null,
      congestionLevel,
    };
  });

  return {
    userId,
    userLocation: { latitude, longitude },
    vehicle: vehicle
      ? { vehicleId: vehicle._id?.toString() ?? null, make: vehicle.make, model: vehicle.model }
      : null,
    candidates,
  };
}

export default buildRecommendationRequest;