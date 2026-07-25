import axios from "axios";

const PYTHON_API = process.env.PYTHON_API_URL;

export interface WeatherAwareRoutingPayload {
  origin: string;
  destination: string;
  ac_on: boolean;
}

export interface RouteLocation {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distance_m: number;
  duration_s: number;
  start_location: RouteLocation;
  end_location: RouteLocation;
}

export interface WeatherData {
  temp_c: number;
  wind_speed_ms: number;
  wind_deg: number;
}

export interface ChargingStop {
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number | null;
  open_now: boolean | null;
  place_id: string;
}

export interface WeatherAwareRoutingResult {
  origin_resolved: string;
  destination_resolved: string;

  origin_coords: RouteLocation;
  destination_coords: RouteLocation;

  distance_km: number;
  duration_min: number;
  duration_in_traffic_min: number;
  traffic_condition: "light" | "moderate" | "heavy";

  polyline: string;
  steps: RouteStep[];

  energy_nominal_kwh: number;
  energy_with_ac_kwh: number;
  soc_needed_pct: number;
  soc_with_contingency_pct: number;
  ac_on: boolean;

  weather: WeatherData;

  charging_required: boolean;
  charging_stops: ChargingStop[];
}

export default class WeatherAwareRoutingService {
  static async getPrediction(
    payload: WeatherAwareRoutingPayload
  ): Promise<WeatherAwareRoutingResult> {
    try {
      console.log("Sending")
      const response = await axios.post(`${PYTHON_API}/predict`, {
        origin: payload.origin,
        destination: payload.destination,
        ac_on: payload.ac_on,
      });

      console.log("Sent")

      return response.data as WeatherAwareRoutingResult;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          "Failed to fetch weather-aware routing prediction"
      );
    }
  }
}