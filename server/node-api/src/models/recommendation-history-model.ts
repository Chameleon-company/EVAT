// Schemas and db for recommendation session
import mongoose, { Schema, Document } from 'mongoose';

// Recommendatation candidate interface. Not exported, as candidates are only intended to exist within the candidates attribute of the recommendation session.
export interface IRecommendationCandidate {
    stationId: mongoose.Types.ObjectId;

    latitude: number;
    longitude: number;
    operator: string | null;
    connectionType: string | null;
    currentType: string | null;
    chargingPoints: number | null;
    cost: string | null;
    payAtLocation: string | null;
    isOperational: boolean;
    membershipRequired: string | null;
    accessKeyRequired: string | null;

    distanceKm: number | null;
    durationMin: number | null;
    durationInTrafficMin: number | null;
    roadTrafficCondition: string | null;
    energyNominalKwh: number | null;
    energyNeededKwh: number | null;
    socWithContingencyPct: number | null;
    temperatureC: number | null;
    windSpeedMs: number | null;
    windDirectionDeg: number | null;
    congestionLevel: string;

    rank: number;
    score: number;
    reasons: string[];
}

// Interface for the shape of recommendation history documents
export interface IRecommendationSession {
    userId: mongoose.Types.ObjectId;
    userLocation: {
        latitude: number;
        longitude: number;
    };
    candidates: IRecommendationCandidate[];
    selection: {
        stationId: mongoose.Types.ObjectId | null;
        selectedAt: Date | null;
    }
    createdAt: Date;
    updatedAt: Date;
}
// Interface extending IRecommendationSession with MongoDB document structure
export interface IRecommendationSessionDocument extends IRecommendationSession, Document { }

// Recommendation Candidate Schema
const RecommendationCandidateSchema: Schema = new Schema<IRecommendationCandidate>(
    {
        stationId: {
            type: mongoose.Schema.Types.ObjectId,
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
    },
    {
        // Don't generate a separate ID for each candidate, as they are embedded subdocuments of the a session's candidates array.
        _id: false
    }
);

// Recommendation Session Schema 
const RecommendationSessionSchema: Schema = new Schema<IRecommendationSession>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
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
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ChargingStation',
                default: null
            },
            selectedAt: {
                type: Date,
                default: null
            }
        }
    },
    {
        timestamps: true,
    }
);

// Export the default schema
export default mongoose.model<IRecommendationSessionDocument>('RecommendationSession', RecommendationSessionSchema);

// Don't think these are needed
/*
// Allowed CRUD types
export type SessionOperationType = 'insert' | 'update' | 'delete';

// Event schema
export interface IRecommendationSessionEvent {
*/
