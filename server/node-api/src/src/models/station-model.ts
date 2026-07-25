import mongoose, { Schema, Document } from "mongoose";

export interface StationFilterOptions {
  connectorTypes?: string[];
  chargingCurrents?: string[];
  operators?: string[];
  location?: {
    longitude: number;
    latitude: number;
    radiusKm?: number;
  };
}

export interface IChargingStation {
  cost?: string;
  charging_points?: number;
  pay_at_location?: string;
  membership_required?: string;
  access_key_required?: string;
  is_operational?: string;
  latitude?: number;
  longitude?: number;
  operator?: string;
  connection_type?: string;
  current_type?: string;
  charging_points_flag?: number;
  location: {
    type: string;
    coordinates: [number, number]; // [latitude, longitude]
  };
}

const ChargingStationSchema: Schema = new Schema<IChargingStation>(
  {
    cost: { type: String },
    charging_points: { type: Number },
    pay_at_location: { type: String },
    membership_required: { type: String },
    access_key_required: { type: String },
    is_operational: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    operator: { type: String },
    connection_type: { type: String },
    current_type: { type: String },
    charging_points_flag: { type: Number },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [latitude, longitude]
        required: true,
      },
    }
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
    versionKey: false, // Disable the __v field
  }
);

ChargingStationSchema.index({ location: '2dsphere' });

export interface IChargingStationDocument extends IChargingStation, Document {}

const ChargingStation = mongoose.model<IChargingStationDocument>(
  "ChargingStation",
  ChargingStationSchema,
  "charging_stations"
);

export default ChargingStation;