"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BookingSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String, lowercase: true, trim: true },
    datetime: { type: Date, required: true },
    timezone: { type: String },
    tzOffsetMinutes: { type: Number },
    vehicle: { type: String },
    notes: { type: String },
    stationName: { type: String, trim: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
    reference: { type: String, required: true, index: true },
}, { timestamps: true });
// Helpful indexes
BookingSchema.index({ user: 1, datetime: -1 });
BookingSchema.index({ userEmail: 1, datetime: -1 });
exports.default = (0, mongoose_1.model)("Booking", BookingSchema);
