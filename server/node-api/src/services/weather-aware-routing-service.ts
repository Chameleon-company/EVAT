import axios from "axios";

export interface WeatherAwareRoutingPayload {
  year: number;
  start_lat: number;
  start_lon: number;
}

export interface WeatherAwareRoutingResult {
  prediction: number;
  dist_to_nearest_ev_m: number;
  ev_within_500m: number;
  avg_temp: number;
  total_prcp: number;
  used_SHAPE_Length: number;
}

export default class WeatherAwareRoutingService {
  static async getPrediction(
    payload: WeatherAwareRoutingPayload
  ): Promise<WeatherAwareRoutingResult> {
    try {
      const response = await axios.post("http://127.0.0.1:5002/predict", payload);
      const data = response.data;

      return {
        prediction: data.prediction,
        dist_to_nearest_ev_m: data.dist_to_nearest_ev_m,
        ev_within_500m: data.ev_within_500m,
        avg_temp: data.avg_temp,
        total_prcp: data.total_prcp,
        used_SHAPE_Length: data.used_SHAPE_Length,
      };
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.error || "Failed to fetch prediction"
      );
    }
  }
}