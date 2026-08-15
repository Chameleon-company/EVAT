import mongoose, { Schema, Document } from "mongoose";

export const PROMOTION_CATEGORIES = [
  "coffee",
  "food",
  "shopping",
  "entertainment",
  "services",
] as const;

export type PromotionCategory = (typeof PROMOTION_CATEGORIES)[number];

export interface IPromotion {
  title: string;
  description?: string;
  businessName: string;
  category: PromotionCategory;
  discountLabel: string;
  promoCode?: string;
  address?: string;
  websiteUrl?: string;
  terms?: string;
  latitude: number;
  longitude: number;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  stationIds?: string[];
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  distanceMeters?: number;
}

export interface IPromotionDocument extends IPromotion, Document {}

const PromotionSchema: Schema = new Schema<IPromotionDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [120, "Business name cannot exceed 120 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: PROMOTION_CATEGORIES,
    },
    discountLabel: {
      type: String,
      required: [true, "Discount label is required"],
      trim: true,
      maxlength: [80, "Discount label cannot exceed 80 characters"],
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [40, "Promo code cannot exceed 40 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    websiteUrl: {
      type: String,
      trim: true,
      maxlength: [300, "Website URL cannot exceed 300 characters"],
    },
    terms: {
      type: String,
      trim: true,
      maxlength: [400, "Terms cannot exceed 400 characters"],
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    stationIds: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PromotionSchema.index({ location: "2dsphere" });
PromotionSchema.index({ isActive: 1, category: 1 });
PromotionSchema.index({ stationIds: 1 });

const Promotion = mongoose.model<IPromotionDocument>(
  "Promotion",
  PromotionSchema,
  "promotions"
);

export default Promotion;
