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

    // Review fix: if there are no nearby stations, short-circuit here with an
    // empty result rather than calling the congestion API with an empty
    // array (which throws) and turning a valid no-results case into a 500.
    if (stations.length === 0) {
      const profile = await this.profileService.getUserProfile(userId);
      const sessionId = await this.recommendationHistoryService.createSession({
        userId,
        userLocation: { latitude, longitude },
        candidates: [],
      });
      return {
        sessionId: sessionId.toString(),
        recommendations: [],
        generatedAt: new Date().toISOString(),
      };
    }

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
      const routingAvailable = routing !== null;

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
        routingAvailable,
        distanceKm: routingAvailable ? routing.distance_km : null,
        durationMin: routingAvailable ? routing.duration_min : null,
        durationInTrafficMin: routingAvailable ? routing.duration_in_traffic_min : null,
        roadTrafficCondition: routingAvailable ? routing.traffic_condition : null,
        energyNominalKwh: routingAvailable ? routing.energy_nominal_kwh : null,
        energyNeededKwh: routingAvailable ? routing.energy_with_ac_kwh : null,
        socWithContingencyPct: routingAvailable ? routing.soc_with_contingency_pct : null,
        temperatureC: routingAvailable ? routing.weather?.temp_c : null,
        windSpeedMs: routingAvailable ? routing.weather?.wind_speed_ms : null,
        windDirectionDeg: routingAvailable ? routing.weather?.wind_deg : null,
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
      }))
      .sort((a, b) => a.rank - b.rank);

    const sessionId = await this.recommendationHistoryService.createSession({
      userId,
      userLocation: { latitude, longitude },
      candidates: candidatesWithRank as any,
    });

    return {
      sessionId: sessionId.toString(),
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