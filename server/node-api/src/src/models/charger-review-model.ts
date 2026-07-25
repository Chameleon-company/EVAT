import mongoose, { Schema, Document } from "mongoose";

export interface IChargerReview extends Document {
  chargerId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChargerReviewSchema: Schema = new Schema<IChargerReview>(
  {
    chargerId: {
      type: String,
      required: [true, "Charger ID is required"],
      trim: true,
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      trim: true,
    },
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      maxlength: [100, "User name cannot exceed 100 characters"],
    },
    userAvatar: {
      type: String,
      trim: true,
      default: null,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for efficient queries
ChargerReviewSchema.index({ chargerId: 1, createdAt: -1 });
ChargerReviewSchema.index({ userId: 1, chargerId: 1 }, { unique: true }); // One review per user per charger

const ChargerReview = mongoose.model<IChargerReview>("ChargerReview", ChargerReviewSchema, "charger_reviews");

export default ChargerReview;
