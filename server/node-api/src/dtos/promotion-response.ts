import { IPromotion } from "../models/promotion-model";

const METERS_PER_WALKING_MINUTE = 80;

export class PromotionResponse {
  public id: string;
  public title: string;
  public description?: string;
  public businessName: string;
  public category: string;
  public discountLabel: string;
  public promoCode?: string;
  public address?: string;
  public websiteUrl?: string;
  public terms?: string;
  public latitude: number;
  public longitude: number;
  public stationIds: string[];
  public isActive: boolean;
  public startsAt?: Date | null;
  public endsAt?: Date | null;
  public distanceMeters: number | null;
  public walkingMinutes: number | null;
  public isFallback: boolean;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(
    promotion: IPromotion & { _id?: { toString(): string }; isFallback?: boolean }
  ) {
    this.id = promotion._id ? promotion._id.toString() : "";
    this.title = promotion.title;
    this.description = promotion.description;
    this.businessName = promotion.businessName;
    this.category = promotion.category;
    this.discountLabel = promotion.discountLabel;
    this.promoCode = promotion.promoCode;
    this.address = promotion.address;
    this.websiteUrl = promotion.websiteUrl;
    this.terms = promotion.terms;
    this.latitude = promotion.latitude;
    this.longitude = promotion.longitude;
    this.stationIds = promotion.stationIds || [];
    this.isActive = promotion.isActive;
    this.startsAt = promotion.startsAt;
    this.endsAt = promotion.endsAt;
    this.distanceMeters =
      promotion.distanceMeters != null
        ? Math.round(promotion.distanceMeters)
        : null;
    this.walkingMinutes =
      this.distanceMeters != null
        ? Math.max(1, Math.round(this.distanceMeters / METERS_PER_WALKING_MINUTE))
        : null;
    this.isFallback = Boolean(promotion.isFallback);
    this.createdAt = promotion.createdAt;
    this.updatedAt = promotion.updatedAt;
  }
}
