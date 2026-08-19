"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Schemas and db for recommendation session
const mongoose_1 = __importStar(require("mongoose"));
// Recommendation Candidate Schema
const RecommendationCandidateSchema = new mongoose_1.Schema({
    stationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'ChargingStation',
        required: true
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    operator: { type: String, default: null },
    connectionType: { type: String, default: null },
    currentType: { type: String, default: null },
    chargingPoints: { type: Number, default: null },
    cost: { type: String, default: null },
    payAtLocation: { type: String, default: null }, // This is listed as yes/no in the system flow diagram rather than true/false, hence implemented as a string.
    isOperational: { type: Boolean, required: true },
    membershipRequired: { type: String, default: null },
    accessKeyRequired: { type: String, default: null },
    distanceKm: { type: Number, default: null },
    durationMin: { type: Number, default: null },
    durationInTrafficMin: { type: Number, default: null },
    roadTrafficCondition: { type: String, default: null },
    energyNominalKwh: { type: Number, default: null },
    energyNeededKwh: { type: Number, default: null },
    socWithContingencyPct: { type: Number, default: null },
    temperatureC: { type: Number, default: null },
    windSpeedMs: { type: Number, default: null },
    windDirectionDeg: { type: Number, default: null },
    congestionLevel: { type: String, required: true },
    rank: { type: Number, required: true },
    score: { type: Number, required: true },
    reasons: { type: [String], default: [] }
}, {
    // Don't generate a separate ID for each candidate, as they are embedded subdocuments of the a session's candidates array.
    _id: false
});
// Recommendation Session Schema 
const RecommendationSessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    candidates: {
        type: [RecommendationCandidateSchema],
        required: true,
        default: []
    },
    selection: {
        stationId: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'ChargingStation',
            default: null
        },
        selectedAt: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true,
});
// Export the default schema
exports.default = mongoose_1.default.model('RecommendationSession', RecommendationSessionSchema);
// Don't think these are needed
/*
// Allowed CRUD types
export type SessionOperationType = 'insert' | 'update' | 'delete';

// Event schema
export interface IRecommendationSessionEvent {
*/
