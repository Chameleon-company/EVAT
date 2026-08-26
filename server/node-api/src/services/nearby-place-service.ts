import ChargingStationRepository from "../repositories/station-repository";
import GoogleNearbyPlacesService, {
  NearbyPlace,
} from "./google-nearby-places-service";

const DEFAULT_RADIUS_KM = 1;
const MAX_RADIUS_KM = 3;

function stationCoordinates(station: {
  latitude?: number;
  longitude?: number;
  location?: { coordinates?: [number, number] };
}): { latitude: number; longitude: number } | null {
  const latitude = station.latitude ?? station.location?.coordinates?.[1];
  const longitude = station.longitude ?? station.location?.coordinates?.[0];
  if (latitude == null || longitude == null || Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
    return null;
  }
  return { latitude: Number(latitude), longitude: Number(longitude) };
}

export default class NearbyPlaceService {
  private validateCoordinates(latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("latitude and longitude are required");
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error("latitude must be between -90 and 90");
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error("longitude must be between -180 and 180");
    }
  }

  private resolveRadiusKm(radiusKm?: number): number {
    const radius = radiusKm == null ? DEFAULT_RADIUS_KM : Number(radiusKm);
    if (Number.isNaN(radius) || radius <= 0) {
      throw new Error("radiusKm must be a number greater than 0");
    }
    return Math.min(radius, MAX_RADIUS_KM);
  }

  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusKm?: number,
    category?: string
  ): Promise<NearbyPlace[]> {
    this.validateCoordinates(latitude, longitude);
    const radius = this.resolveRadiusKm(radiusKm);
    return GoogleNearbyPlacesService.findNearbyPlaces(
      latitude,
      longitude,
      radius * 1000,
      category
    );
  }

  async getNearbyForStation(
    stationId: string,
    radiusKm?: number,
    category?: string
  ): Promise<NearbyPlace[]> {
    if (!stationId) {
      throw new Error("Station ID is required");
    }

    const station = await ChargingStationRepository.findById(stationId);
    if (!station) {
      throw new Error("Charging station not found");
    }

    const coords = stationCoordinates(station);
    if (!coords) {
      throw new Error("Station location is unavailable");
    }

    return this.getNearbyPlaces(coords.latitude, coords.longitude, radiusKm, category);
  }

  async getPhotoUri(photoName: string): Promise<string> {
    if (!photoName) {
      throw new Error("Photo name is required");
    }
    return GoogleNearbyPlacesService.getPhotoUri(photoName);
  }
}
