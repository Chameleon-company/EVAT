import axios from "axios";
import ChargingStationRepository from "../repositories/station-repository";
import GoogleNearbyPlacesService, {
  NearbyPlace,
} from "./google-nearby-places-service";
import TtlCache from "../utils/ttl-cache";

const DEFAULT_RADIUS_KM = 1;
const MAX_RADIUS_KM = 3;

/** Places results stay fresh for ~10 minutes to cut repeat Google Calls. */
const PLACES_CACHE_TTL_MS = 10 * 60 * 1000;
const PHOTO_CACHE_TTL_MS = 10 * 60 * 1000;
const PLACES_CACHE_MAX = 200;
const PHOTO_CACHE_MAX = 80;

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

function normalizeCategory(category?: string): string {
  return (category || "all").toLowerCase().trim() || "all";
}

function placesCacheKey(
  latitude: number,
  longitude: number,
  radiusKm: number,
  category: string
): string {
  // ~11 m precision is enough so tiny float differences still hit the cache.
  return `places:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusKm}:${category}`;
}

function stationCacheKey(
  stationId: string,
  radiusKm: number,
  category: string
): string {
  return `station:${stationId}:${radiusKm}:${category}`;
}

export default class NearbyPlaceService {
  private readonly placesCache = new TtlCache<NearbyPlace[]>(
    PLACES_CACHE_TTL_MS,
    PLACES_CACHE_MAX
  );
  private readonly photoCache = new TtlCache<{ bytes: Buffer; contentType: string }>(
    PHOTO_CACHE_TTL_MS,
    PHOTO_CACHE_MAX
  );

  /** Test helper — clears in-memory caches. */
  clearCaches(): void {
    this.placesCache.clear();
    this.photoCache.clear();
  }

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
    const normalizedCategory = normalizeCategory(category);
    const cacheKey = placesCacheKey(latitude, longitude, radius, normalizedCategory);

    const cached = this.placesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const places = await GoogleNearbyPlacesService.findNearbyPlaces(
      latitude,
      longitude,
      radius * 1000,
      normalizedCategory
    );
    this.placesCache.set(cacheKey, places);
    return places;
  }

  async getNearbyForStation(
    stationId: string,
    radiusKm?: number,
    category?: string
  ): Promise<NearbyPlace[]> {
    if (!stationId) {
      throw new Error("Station ID is required");
    }

    const radius = this.resolveRadiusKm(radiusKm);
    const normalizedCategory = normalizeCategory(category);
    const cacheKey = stationCacheKey(stationId, radius, normalizedCategory);

    const cached = this.placesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const station = await ChargingStationRepository.findById(stationId);
    if (!station) {
      throw new Error("Charging station not found");
    }

    const coords = stationCoordinates(station);
    if (!coords) {
      throw new Error("Station location is unavailable");
    }

    const places = await this.getNearbyPlaces(
      coords.latitude,
      coords.longitude,
      radius,
      normalizedCategory
    );
    // Also key by station id so reopen/filter hits skip the DB lookup.
    this.placesCache.set(cacheKey, places);
    return places;
  }

  async getPhotoUri(photoName: string): Promise<string> {
    if (!photoName) {
      throw new Error("Photo name is required");
    }
    return GoogleNearbyPlacesService.getPhotoUri(photoName);
  }

  async getPhoto(
    photoName: string
  ): Promise<{ bytes: Buffer; contentType: string }> {
    const cached = this.photoCache.get(photoName);
    if (cached) {
      return cached;
    }

    const photoUri = await this.getPhotoUri(photoName);
    const response = await axios.get(photoUri, {
      responseType: "arraybuffer",
      timeout: 8000,
    });
    const photo = {
      bytes: Buffer.from(response.data),
      contentType: String(response.headers["content-type"] || "image/jpeg"),
    };
    this.photoCache.set(photoName, photo);
    return photo;
  }
}
