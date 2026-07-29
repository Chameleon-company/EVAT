import ChargingStationService from "./station-service";
import ProfileService from "./profile-service";
import VehicleService from "./vehicle-service";
import PredictService from "./predict-service";
import WeatherAwareRoutingService from "./weather-aware-routing-service";
import buildRecommendationRequest from "./recommendation-request-builder";

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

    // Step 4/5: Weather-aware routing — call once per candidate station
    const routingResults = await Promise.all(
      stations.map(async (station: any) => {
        try {
          const result = await WeatherAwareRoutingService.getPrediction({
            origin: `${latitude},${longitude}`,
            destination: `${station.latitude},${station.longitude}`,
            ac_on: true, // TODO: confirm default / where this comes from
          });
          return { stationId: station._id.toString(), routing: result };
        } catch (error: any) {
          console.error(`Weather routing failed for station ${station._id}:`, error.message);
          return { stationId: station._id.toString(), routing: null };
        }
      })
    );

    // Step 14: Assemble the request for the Recommendation ML API
    // NOTE: this shape is a PROPOSAL pending confirmation from Tom/Kawser
    const recommendationRequest = buildRecommendationRequest(
      userId,
      latitude,
      longitude,
      stations,
      routingResults,
      congestionLevels,
      vehicle
    );

    // Step 17: Call the Recommendation ML API
    // TODO: confirm endpoint URL/contract with Tom/Kawser
    // const ranked = await RecommendationMlService.rank(recommendationRequest);

    // Step 18: Return ranked recommendations
    return recommendationRequest;
  }

  async saveSelection(recommendationId: string, stationId: string) {
    // Step 19/20: Save the user's selection
    // TODO: blocked on RecommendationHistoryService.recordSelection()
  }
}