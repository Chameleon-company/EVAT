import { Schema, model, Document, Types } from "mongoose";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface BookingDoc extends Document {
  user?: Types.ObjectId;          // if authenticated
  userEmail?: string;             // if guest
  datetime: Date;                 // ISO from client (UTC)
  timezone?: string;              // e.g. "Australia/Melbourne"
  tzOffsetMinutes?: number;       // client offset at booking time
  vehicle?: string;
  notes?: string;
  stationName?: string;
  status: BookingStatus;
  reference: string;              // human-readable ref to show user
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String, lowercase: true, trim: true },
    datetime: { type: Date, required: true },
    timezone: { type: String },
    tzOffsetMinutes: { type: Number },
    vehicle: { type: String },
    notes: { type: String },
    stationName: { type: String, trim: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
    reference: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Helpful indexes
BookingSchema.index({ user: 1, datetime: -1 });
BookingSchema.index({ userEmail: 1, datetime: -1 });

export default model<BookingDoc>("Booking", BookingSchema);