// Schemas and db for charging session

import mongoose, { Schema, Document } from 'mongoose';
// Define status for charging session
export type SessionStatus = 'in_progress' | 'completed' | 'error' | 'deleted';

// Interface for the shape of charging session documents
export interface IChargerSession {
  userId: mongoose.Types.ObjectId;
  stationId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  // In kWh
  energyDelivered?: number;
  cost?: number;
  status: SessionStatus;
  // createdAt, updatedAt
}
// Interface extending IChargerSession with MongoDB document structure
export interface IChargerSessionDocument extends IChargerSession, Document {}

// Schema configuration (userId, stationId, startTime, endTime, energyDelivered, cost, and status)
const ChargerSessionSchema: Schema = new Schema<IChargerSession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingStation',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    energyDelivered: {
      type: Number,
    },
    cost: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'error'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
// Export the default schema
export default mongoose.model<IChargerSessionDocument>(
  'ChargerSession',
  ChargerSessionSchema,
  'charger_sessions'
);

// Event schema for data streaming
export type SessionOperationType = 'insert' | 'update' | 'delete';

// Some will be optional for service
export interface IChargerSessionEvent {
  sessionId: string;
  userId?: string;
  stationId?: string;
  status?: SessionStatus;
  timestamp: Date                         // Timestamp of event emitted
  operationType: SessionOperationType;    // Type of action
  energyDelivered?: number;
  cost?: number;
}
