import axios from "axios";

const RECOMMENDATION_API_URL = process.env.RECOMMENDATION_API_URL || "http://127.0.0.1:8002";

export interface RankChargingStationsRequest {
  userId: string;
  userLocation: { latitude: number; longitude: number };
  userProfile: {
    vehicle: {
      vehicleId: string;
      make?: string;
      model?: string;
      variant?: string;
      fuelType?: string;
      energyConsumptionWhkm?: number;
      electricRangeKm?: number;
    };
    favouriteStationIds: string[];
    userHistory: any[];
  };
  candidates: any[];
}

export interface ChargingStationRecommendation {
  stationId: string;
  rank: number;
  score: number;
  reasons: string[];
}

export interface RankChargingStationsResponse {
  recommendations: ChargingStationRecommendation[];
}

export default class RecommendationRankingService {
  static async rankStations(
    payload: RankChargingStationsRequest
  ): Promise<RankChargingStationsResponse> {
    try {
      const response = await axios.post(
        `${RECOMMENDATION_API_URL}/charging-station-recommendations/rank`,
        payload
      );
      return response.data as RankChargingStationsResponse;
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      throw new Error(
        typeof detail === "string"
          ? detail
          : detail
          ? JSON.stringify(detail)
          : "Failed to fetch charging station recommendations"
      );
    }
  }
}