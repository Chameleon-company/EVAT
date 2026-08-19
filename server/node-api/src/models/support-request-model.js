"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SupportRequestSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    issue: { type: String, enum: ["station", "payment", "info", "other"], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    requestNo: { type: Number, required: true },
    reference: { type: String, required: true, index: true },
}, { timestamps: true });
// Uniqueness per-user for the sequence
SupportRequestSchema.index({ user: 1, requestNo: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)("SupportRequest", SupportRequestSchema);
