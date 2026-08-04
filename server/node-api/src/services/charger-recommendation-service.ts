import ChargingStationService from "./station-service";
import ProfileService from "./profile-service";
import VehicleService from "./vehicle-service";
import PredictService from "./predict-service";
import WeatherAwareRoutingService from "./weather-aware-routing-service";
import RecommendationHistoryService from "./recommendation-history-service";
import RecommendationHistoryRepository from "../repositories/recommendation-history-repository";
import RecommendationRankingService from "./recommendation-ranking-service";

interface RecommendationRequest {
  userId: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

function toBoolean(value: string | undefined): boolean {
  // Real station data frequently has "Unknown" for is_operational due to
  // incomplete source data. Treating it as operational (rather than
  // excluding it) avoids filtering out most/all candidates. Only explicit
  // negative values are treated as non-operational.
  if (!value) return true;
  const normalized = value.toLowerCase();
  return !["no", "false", "closed", "unavailable", "out of service"].includes(normalized);
}

export default class ChargerRecommendationService {
  private stationService = new ChargingStationService();
  private profileService = new ProfileService();
  private vehicleService = new VehicleService();
  private predictService = new PredictService();
  private recommendationHistoryService = new RecommendationHistoryService(
    new RecommendationHistoryRepository()
  );

  async getRecommendations(request: RecommendationRequest) {
    const { userId, latitude, longitude, radiusKm = 10 } = request;

    const stations = await this.stationService.getAllStations({
      location: { latitude, longitude, radiusKm },
    });

    // ML API only accepts up to 10 candidates — stations are already
    // nearest-first from the $near query, so take the closest 10
    const limitedStations = stations.slice(0, 10);

    const profile = await this.profileService.getUserProfile(userId);

    const vehicle = profile.user_car_model
      ? await this.vehicleService.getVehicleById(profile.user_car_model)
      : null;

    const recentSessions = await this.recommendationHistoryService.getRecentSessions(userId);

    const stationIds = limitedStations.map((s: any) => s._id.toString());
    const { congestionLevels } = await this.predictService.getCongestionLevels(stationIds);
    const congestionByStation = new Map(
      congestionLevels.map((c: any) => [c.chargerId.toString(), c.congestion_level])
    );

    const routingResults = await Promise.all(
      limitedStations.map(async (station: any) => {
        try {
          const result = await WeatherAwareRoutingService.getPrediction({
            origin: `${latitude},${longitude}`,
            destination: `${station.latitude},${station.longitude}`,
            ac_on: true,
          });
          return { stationId: station._id.toString(), routing: result };
        } catch (error: any) {
          console.error(`Weather routing failed for station ${station._id}:`, error.message);
          return { stationId: station._id.toString(), routing: null };
        }
      })
    );
    const routingByStation = new Map(routingResults.map((r) => [r.stationId, r.routing]));

    const candidates = limitedStations.map((station: any) => {
      const stationId = station._id.toString();
      const routing: any = routingByStation.get(stationId);
      const congestionLevel = congestionByStation.get(stationId) ?? "unknown";

      return {
        stationId,
        latitude: station.latitude,
        longitude: station.longitude,
        operator: station.operator,
        connectionType: station.connection_type,
        currentType: station.current_type,
        chargingPoints: station.charging_points,
        cost: station.cost,
        payAtLocation: station.pay_at_location,
        membershipRequired: station.membership_required,
        accessKeyRequired: station.access_key_required,
        isOperational: toBoolean(station.is_operational),
        // TODO: GOOGLE_MAPS_API_KEY not yet configured, so Weather-Aware
        // Routing calls currently fail for every station. Falling back to
        // safe defaults so the pipeline completes end-to-end; revisit once
        // the key is set up.
        distanceKm: routing?.distance_km ?? 0,
        durationMin: routing?.duration_min ?? 0,
        durationInTrafficMin: routing?.duration_in_traffic_min ?? 0,
        roadTrafficCondition: routing?.traffic_condition ?? "unknown",
        energyNominalKwh: routing?.energy_nominal_kwh ?? 0,
        energyNeededKwh: routing?.energy_with_ac_kwh ?? 0,
        socWithContingencyPct: routing?.soc_with_contingency_pct ?? 0,
        temperatureC: routing?.weather?.temp_c ?? 0,
        windSpeedMs: routing?.weather?.wind_speed_ms ?? 0,
        windDirectionDeg: routing?.weather?.wind_deg ?? 0,
        congestionLevel,
      };
    });

    const userProfile = {
      vehicle: {
        vehicleId: vehicle?._id?.toString() ?? "",
        make: vehicle?.make,
        model: vehicle?.model,
        variant: vehicle?.variant,
        fuelType: vehicle?.fuel_type,
        energyConsumptionWhkm: vehicle?.energy_consumption_whkm,
        electricRangeKm: vehicle?.electric_range_km,
      },
      favouriteStationIds: profile.favourite_stations ?? [],
      userHistory: recentSessions
        .filter((s: any) => s.selection?.stationId)
        .map((s: any) => ({
          candidates: s.candidates,
          selection: {
            stationId: s.selection.stationId?.toString() ?? null,
            selectedAt: s.selection.selectedAt,
          },
        })),
    };

    const { recommendations } = await RecommendationRankingService.rankStations({
      userId,
      userLocation: { latitude, longitude },
      userProfile,
      candidates,
    });

    const rankByStation = new Map(recommendations.map((r) => [r.stationId, r]));
    const candidatesWithRank = candidates
      .filter((c) => rankByStation.has(c.stationId))
      .map((c) => ({
        ...c,
        rank: rankByStation.get(c.stationId)!.rank,
        score: rankByStation.get(c.stationId)!.score,
        reasons: rankByStation.get(c.stationId)!.reasons,
      }));

    const sessionId = await this.recommendationHistoryService.createSession({
      userId,
      userLocation: { latitude, longitude },
      candidates: candidatesWithRank as any,
    });

    return {
      recommendationId: sessionId.toString(),
      recommendations: candidatesWithRank,
      generatedAt: new Date().toISOString(),
    };
  }

  async saveSelection(
    sessionId: string,
    stationId: string,
    requestingUserId: string
  ) {
    await this.recommendationHistoryService.recordSelection(
      sessionId,
      stationId,
      requestingUserId,
      new Date()
    );
  }
}