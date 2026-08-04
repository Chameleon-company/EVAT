// Schemas and db for recommendation session
import mongoose, { Schema, Document } from 'mongoose';

// Recommendatation candidate interface. Not exported, as candidates are only intended to exist within the candidates attribute of the recommendation session.
export interface IRecommendationCandidate {
    stationId: mongoose.Types.ObjectId;

    latitude: number;
    longitude: number;
    operator: string;
    chargingPoints: number;
    cost: string;
    payAtLocation: string;
    isOperational: boolean;

    distanceKm: number;
    durationMin: number;
    durationInTrafficMin: number;
    roadTrafficCondition: string;
    energyNominalKwh: number;
    energyNeededKwh: number;
    socWithContingencyPct: number;
    temperatureC: number;
    windSpeedMs: number;
    windDirectionDeg: number;
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
        operator: { type: String, required: true },
        chargingPoints: { type: Number, required: true },
        cost: { type: String, required: true },
        payAtLocation: { type: String, required: true }, // This is listed as yes/no in the system flow diagram rather than true/false, hence implemented as a string.
        isOperational: { type: Boolean, required: true },
        distanceKm: { type: Number, required: true },
        durationMin: { type: Number, required: true },
        durationInTrafficMin: { type: Number, required: true },
        roadTrafficCondition: { type: String, required: true },
        energyNominalKwh: { type: Number, required: true },
        energyNeededKwh: { type: Number, required: true },
        socWithContingencyPct: { type: Number, required: true },
        temperatureC: { type: Number, required: true },
        windSpeedMs: { type: Number, required: true },
        windDirectionDeg: { type: Number, required: true },
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