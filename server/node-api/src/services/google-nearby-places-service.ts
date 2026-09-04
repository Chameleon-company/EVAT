import axios from "axios";

export const PLACE_CATEGORIES = ["food", "shopping"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number] | "all";

export interface NearbyPlace {
  id: string;
  name: string;
  category: "food" | "shopping";
  typeLabel: string;
  address: string;
  rating: number | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  walkingMinutes: number;
  googleMapsUri: string | null;
  directionsUrl: string;
  photoName: string | null;
  isOpen: boolean | null;
}

const CATEGORY_PLACE_TYPES: Record<string, string[]> = {
  food: ["restaurant", "cafe", "bakery", "meal_takeaway"],
  shopping: [
    "supermarket",
    "shopping_mall",
    "convenience_store",
    "clothing_store",
    "department_store",
  ],
  all: [
    "restaurant",
    "cafe",
    "bakery",
    "supermarket",
    "shopping_mall",
    "convenience_store",
  ],
};

const TYPE_TO_CATEGORY: Record<string, "food" | "shopping"> = {
  restaurant: "food",
  cafe: "food",
  bakery: "food",
  meal_takeaway: "food",
  meal_delivery: "food",
  supermarket: "shopping",
  shopping_mall: "shopping",
  convenience_store: "shopping",
  clothing_store: "shopping",
  department_store: "shopping",
};

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe",
  bakery: "Bakery",
  meal_takeaway: "Takeaway",
  supermarket: "Supermarket",
  shopping_mall: "Shopping mall",
  convenience_store: "Convenience",
  clothing_store: "Clothing",
  department_store: "Department store",
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.rating",
  "places.googleMapsUri",
  "places.photos",
  "places.currentOpeningHours",
].join(",");

const METERS_PER_WALKING_MINUTE = 80;

export function includedTypesForCategory(category?: string): string[] {
  const key = (category || "all").toLowerCase().trim();
  if (key !== "all" && key !== "food" && key !== "shopping") {
    throw new Error("Invalid category. Must be one of: all, food, shopping");
  }
  return CATEGORY_PLACE_TYPES[key];
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadius = 6371000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function isValidPhotoName(name: string): boolean {
  if (!name || name.includes("..") || name.includes("://")) {
    return false;
  }
  return /^places\/[^/]+\/photos\/[^/]+$/.test(name);
}

export function buildWalkingDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  // Path waypoints pin both ends so Google Maps does not replace origin
  // with the viewer's GPS. Destination must be coordinates, not a place name.
  const origin = `${originLat},${originLng}`;
  const destination = `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/${origin}/${destination}/data=!3e2`;
}

function mapCategory(types: string[] = []): "food" | "shopping" {
  for (const type of types) {
    if (TYPE_TO_CATEGORY[type]) {
      return TYPE_TO_CATEGORY[type];
    }
  }
  return "shopping";
}

function typeLabel(place: { primaryType?: string; types?: string[] }): string {
  const primary = place.primaryType || place.types?.[0];
  return (primary && TYPE_LABELS[primary]) || "Place";
}

class GoogleNearbyPlacesService {
  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    category?: string
  ): Promise<NearbyPlace[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const includedTypes = includedTypesForCategory(category);

    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        includedTypes,
        maxResultCount: 15,
        rankPreference: "DISTANCE",
        languageCode: "en-AU",
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: Math.min(Math.max(radiusMeters, 50), 5000),
          },
        },
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
      }
    );

    const places = response.data?.places || [];
    const mapped: NearbyPlace[] = [];

    for (const place of places) {
      const placeLat = Number(place.location?.latitude);
      const placeLng = Number(place.location?.longitude);
      if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) {
        continue;
      }

      const types: string[] = place.types || [];
      const mappedCategory = mapCategory(
        place.primaryType ? [place.primaryType, ...types] : types
      );
      if (category && category !== "all" && mappedCategory !== category) {
        continue;
      }

      const name = place.displayName?.text || "Nearby place";
      const distanceMeters = Math.round(
        haversineMeters(latitude, longitude, placeLat, placeLng)
      );
      const placeId = String(place.id || "").replace(/^places\//, "");

      mapped.push({
        id: placeId || name,
        name,
        category: mappedCategory,
        typeLabel: typeLabel(place),
        address: place.formattedAddress || "",
        rating: place.rating ?? null,
        latitude: placeLat,
        longitude: placeLng,
        distanceMeters,
        walkingMinutes: Math.max(1, Math.round(distanceMeters / METERS_PER_WALKING_MINUTE)),
        googleMapsUri: place.googleMapsUri || null,
        directionsUrl: buildWalkingDirectionsUrl(
          latitude,
          longitude,
          placeLat,
          placeLng
        ),
        photoName: place.photos?.[0]?.name || null,
        isOpen: place.currentOpeningHours?.openNow ?? null,
      });
    }

    return mapped.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  async getPhotoUri(photoName: string): Promise<string> {
    if (!isValidPhotoName(photoName)) {
      throw new Error("Invalid photo name");
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const response = await axios.get(
      `https://places.googleapis.com/v1/${photoName}/media`,
      {
        timeout: 5000,
        params: {
          maxHeightPx: 400,
          maxWidthPx: 400,
          skipHttpRedirect: true,
        },
        headers: {
          "X-Goog-Api-Key": apiKey,
        },
      }
    );

    const photoUri = response.data?.photoUri;
    if (!photoUri) {
      throw new Error("Place photo is unavailable");
    }
    return photoUri;
  }
}

export default new GoogleNearbyPlacesService();
