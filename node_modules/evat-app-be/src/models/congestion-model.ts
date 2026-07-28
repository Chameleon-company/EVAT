import { query } from "express";
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICongestion extends Document {
  chargerId: Types.ObjectId;
  congestion_level: string // "low", "Medium", "High", "Unknown"
}
const CongestionSchema: Schema = new Schema<ICongestion>(
  {
    chargerId: {
      type: Schema.Types.ObjectId,
      ref: 'Charger',
      required: [true, "Charger ID is required"],
      unique: true
    },
    congestion_level: {
      type: String,
      required: [true, "Congestion level is required"],
      trim: true
    }
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

CongestionSchema.index({ chargerId: 1, congestion_level: 1 }, { unique: true }); // One level per user per charger

const Congestion = mongoose.model<ICongestion>("Congestion", CongestionSchema, "congestion");

export default Congestion;