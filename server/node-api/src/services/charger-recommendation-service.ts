import ChargingStationService from "./station-service";
import ProfileService from "./profile-service";
import VehicleService from "./vehicle-service";
import PredictService from "./predict-service";
import WeatherAwareRoutingService from "./weather-aware-routing-service";

interface RecommendationRequest {
  userId: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export default class ChargerRecommendationService {
  private stationService = new ChargingStationService();
  private profileService = new ProfileService();
  private vehicleService = new VehicleService();
  private predictService = new PredictService();

  async getRecommendations(request: RecommendationRequest) {
    const { userId, latitude, longitude, radiusKm = 10 } = request;

    // Step 2/3: Nearby stations
    const stations = await this.stationService.getAllStations({
      location: { latitude, longitude, radiusKm },
    });

    // Step 8/9: User profile
    const profile = await this.profileService.getUserProfile(userId);

    // Step 10/11: Vehicle details (only if profile has a car model set)
    const vehicle = profile.user_car_model
      ? await this.vehicleService.getVehicleById(profile.user_car_model)
      : null;

    // Step 12/13: Recommendation history
    // TODO: blocked on RecommendationHistoryService — Duncan hasn't started task 041S0 yet
    // const history = await recommendationHistoryService.getRecentCompletedByUserId(userId);

    // Step 6/7: Congestion for these stations
    const stationIds = stations.map((s: any) => s._id.toString());
    const { congestionLevels } = await this.predictService.getCongestionLevels(stationIds);

    // Step 4/5: Weather-aware routing — call once per candidate station,
    // using the user's current location as origin and each station as destination
    const routingResults = await Promise.all(
      stations.map(async (station: any) => {
        try {
          const result = await WeatherAwareRoutingService.getPrediction({
            origin: `${latitude},${longitude}`,
            destination: `${station.latitude},${station.longitude}`,
            ac_on: true, // TODO: confirm default / where this comes from (user preference?)
          });
          return { stationId: station._id.toString(), routing: result };
        } catch (error: any) {
          // Don't let one failed routing call break the whole recommendation batch
          console.error(`Weather routing failed for station ${station._id}:`, error.message);
          return { stationId: station._id.toString(), routing: null };
        }
      })
    );

    // Step 14: Assemble payload for the Recommendation ML API
    const candidatePayload = {
      userId,
      profile,
      vehicle,
      stations,
      congestionLevels,
      routingResults,
      // history,
    };

    // Step 17: Call the Recommendation ML API
    // TODO: confirm endpoint URL/contract with Tom/Kawser
    // const ranked = await RecommendationMlService.rank(candidatePayload);

    // Step 18: Return ranked recommendations
    return candidatePayload; // placeholder until ranking call is wired in
  }

  async saveSelection(recommendationId: string, stationId: string) {
    // Step 19/20: Save the user's selection
    // TODO: blocked on RecommendationHistoryService.recordSelection()
  }
}