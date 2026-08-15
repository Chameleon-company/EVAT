import PromotionRepository from "../repositories/promotion-repository";
import ChargingStationRepository from "../repositories/station-repository";
import {
  IPromotion,
  IPromotionDocument,
  PROMOTION_CATEGORIES,
  PromotionCategory,
} from "../models/promotion-model";
import {
  buildFallbackPromotions,
  buildSamplePromotions,
} from "../data/sample-promotions";
import { FilterQuery } from "mongoose";

const DEFAULT_RADIUS_KM = 0.8;
const MAX_RADIUS_KM = 5;

function haversineMeters(
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

function stationCoordinates(station: {
  latitude?: number;
  longitude?: number;
  location?: { coordinates?: [number, number] };
}): { latitude: number; longitude: number } | null {
  const latitude = station.latitude ?? station.location?.coordinates?.[1];
  const longitude = station.longitude ?? station.location?.coordinates?.[0];
  if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }
  return { latitude: Number(latitude), longitude: Number(longitude) };
}

export interface NearbyPromotionQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
  stationId?: string;
  includeFallbacks?: boolean;
}

export default class PromotionService {
  buildActiveFilter(category?: string): FilterQuery<IPromotion> {
    const now = new Date();
    const filter: FilterQuery<IPromotion> = {
      isActive: true,
      $and: [
        {
          $or: [
            { startsAt: { $exists: false } },
            { startsAt: null },
            { startsAt: { $lte: now } },
          ],
        },
        {
          $or: [
            { endsAt: { $exists: false } },
            { endsAt: null },
            { endsAt: { $gte: now } },
          ],
        },
      ],
    };

    if (category) {
      if (!PROMOTION_CATEGORIES.includes(category as PromotionCategory)) {
        throw new Error(
          `Invalid category. Must be one of: ${PROMOTION_CATEGORIES.join(", ")}`
        );
      }
      filter.category = category;
    }

    return filter;
  }

  private resolveRadiusKm(radiusKm?: number): number {
    const radius = radiusKm == null ? DEFAULT_RADIUS_KM : Number(radiusKm);
    if (Number.isNaN(radius) || radius <= 0) {
      throw new Error("radiusKm must be a number greater than 0");
    }
    return Math.min(radius, MAX_RADIUS_KM);
  }

  private validateCoordinates(latitude: number, longitude: number) {
    if (latitude == null || longitude == null) {
      throw new Error("latitude and longitude are required");
    }
    if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      throw new Error("latitude and longitude must be valid numbers");
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error("latitude must be between -90 and 90");
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error("longitude must be between -180 and 180");
    }
  }

  private toGeoPoint(latitude: number, longitude: number) {
    return {
      type: "Point",
      coordinates: [longitude, latitude] as [number, number],
    };
  }

  async getNearbyPromotions(
    query: NearbyPromotionQuery
  ): Promise<Array<IPromotion & { isFallback?: boolean }>> {
    this.validateCoordinates(query.latitude, query.longitude);
    const radiusKm = this.resolveRadiusKm(query.radiusKm);
    const filter = this.buildActiveFilter(query.category);

    const nearby = (await PromotionRepository.findNearby(
      query.longitude,
      query.latitude,
      radiusKm * 1000,
      filter
    )) as IPromotion[];

    let linked: IPromotion[] = [];
    if (query.stationId) {
      const stationPromos = await PromotionRepository.findByStationId(
        query.stationId,
        filter
      );
      linked = stationPromos.map((promo) => {
        const plain = promo.toObject() as IPromotion;
        return {
          ...plain,
          distanceMeters:
            plain.distanceMeters ??
            haversineMeters(
              query.latitude,
              query.longitude,
              plain.latitude,
              plain.longitude
            ),
        };
      });
    }

    const merged = new Map<string, IPromotion & { isFallback?: boolean }>();
    for (const promo of [...nearby, ...linked]) {
      const id = (promo as IPromotion & { _id?: { toString(): string } })._id?.toString();
      if (!id) continue;
      const existing = merged.get(id);
      if (!existing || (promo.distanceMeters ?? Infinity) < (existing.distanceMeters ?? Infinity)) {
        merged.set(id, promo);
      }
    }

    const results = Array.from(merged.values()).sort(
      (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
    );

    if (results.length === 0 && query.includeFallbacks !== false) {
      const fallbacks = buildFallbackPromotions(query.latitude, query.longitude);
      return query.category
        ? fallbacks.filter((promo) => promo.category === query.category)
        : fallbacks;
    }

    return results;
  }

  async getNearbyForStation(
    stationId: string,
    radiusKm?: number,
    category?: string,
    includeFallbacks?: boolean
  ): Promise<Array<IPromotion & { isFallback?: boolean }>> {
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

    return this.getNearbyPromotions({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusKm,
      category,
      stationId,
      includeFallbacks,
    });
  }

  async getPromotionById(promotionId: string): Promise<IPromotionDocument | null> {
    if (!promotionId) {
      throw new Error("Promotion ID is required");
    }
    return await PromotionRepository.findById(promotionId);
  }

  async getAllPromotions(
    page: number = 1,
    limit: number = 20,
    category?: string,
    activeOnly?: boolean
  ) {
    const filter: FilterQuery<IPromotion> = {};
    if (category) {
      if (!PROMOTION_CATEGORIES.includes(category as PromotionCategory)) {
        throw new Error(
          `Invalid category. Must be one of: ${PROMOTION_CATEGORIES.join(", ")}`
        );
      }
      filter.category = category;
    }
    if (activeOnly) {
      Object.assign(filter, this.buildActiveFilter(category));
    }

    return await PromotionRepository.findWithPagination(filter, page, limit);
  }

  private validatePayload(data: Partial<IPromotion>) {
    if (!data.title || !data.businessName || !data.discountLabel || !data.category) {
      throw new Error("title, businessName, discountLabel, and category are required");
    }
    if (!PROMOTION_CATEGORIES.includes(data.category as PromotionCategory)) {
      throw new Error(
        `Invalid category. Must be one of: ${PROMOTION_CATEGORIES.join(", ")}`
      );
    }
    this.validateCoordinates(Number(data.latitude), Number(data.longitude));
  }

  async createPromotion(data: Partial<IPromotion>): Promise<IPromotionDocument> {
    this.validatePayload(data);
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);

    return await PromotionRepository.create({
      ...data,
      title: data.title!.trim(),
      businessName: data.businessName!.trim(),
      discountLabel: data.discountLabel!.trim(),
      description: data.description?.trim(),
      promoCode: data.promoCode?.trim(),
      address: data.address?.trim(),
      websiteUrl: data.websiteUrl?.trim(),
      terms: data.terms?.trim(),
      latitude,
      longitude,
      location: this.toGeoPoint(latitude, longitude),
      stationIds: data.stationIds || [],
      isActive: data.isActive !== false,
    });
  }

  async updatePromotion(
    promotionId: string,
    data: Partial<IPromotion>
  ): Promise<IPromotionDocument | null> {
    if (!promotionId) {
      throw new Error("Promotion ID is required");
    }

    const update: Partial<IPromotion> = { ...data };
    if (data.latitude != null || data.longitude != null) {
      const existing = await PromotionRepository.findById(promotionId);
      if (!existing) {
        return null;
      }
      const latitude = Number(data.latitude ?? existing.latitude);
      const longitude = Number(data.longitude ?? existing.longitude);
      this.validateCoordinates(latitude, longitude);
      update.latitude = latitude;
      update.longitude = longitude;
      update.location = this.toGeoPoint(latitude, longitude);
    }

    if (data.category && !PROMOTION_CATEGORIES.includes(data.category as PromotionCategory)) {
      throw new Error(
        `Invalid category. Must be one of: ${PROMOTION_CATEGORIES.join(", ")}`
      );
    }

    return await PromotionRepository.update({ _id: promotionId }, update);
  }

  async deletePromotion(promotionId: string): Promise<IPromotionDocument | null> {
    if (!promotionId) {
      throw new Error("Promotion ID is required");
    }
    return await PromotionRepository.delete({ _id: promotionId });
  }

  async seedSamplePromotions(): Promise<{ inserted: number; skipped: boolean }> {
    const existing = await PromotionRepository.count();
    if (existing > 0) {
      return { inserted: 0, skipped: true };
    }

    const created = await PromotionRepository.createMany(buildSamplePromotions());
    return { inserted: created.length, skipped: false };
  }
}
