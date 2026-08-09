// Import repository, model interfaces and mongoose
import { Types } from 'mongoose';
import RecommendationHistoryRepository from '../repositories/recommendation-history-repository';
import {
    IRecommendationSession,
    IRecommendationSessionDocument,
} from '../models/recommendation-history-model';
import { ObjectId } from 'mongodb';

// Define partial type for creation of recommendation session, omitting 
type CreateRecommendationSessionInput = Omit<
    IRecommendationSession,
    'userId' | 'selection' | 'createdAt' | 'updatedAt'
> & {
    userId: string;
};

export default class RecommendationHistoryService {

    // Instantiate the repo
    constructor(private readonly recommendationHistoryRepo: RecommendationHistoryRepository) { }

    // Create recommendation session
    async createSession(recSession: CreateRecommendationSessionInput): Promise<Types.ObjectId> {

        // Checking data is valid before creating DB record
        if (!Types.ObjectId.isValid(recSession.userId)) {
            throw new Error('A valid user ID is required.');
        }
        if (!recSession.userLocation) {
            throw new Error('User location is required.');
        }
        if (!Array.isArray(recSession.candidates)) {
            throw new Error('Candidates must be an array of ')
        }

        // Create the session in the database
        const session = await this.recommendationHistoryRepo.create({
            userId: new Types.ObjectId(recSession.userId),
            userLocation: recSession.userLocation,
            candidates: recSession.candidates,
            selection: {
                stationId: null,
                selectedAt: null,
            },
        });

        // Return the sessionId
        return session._id;
    }

    // Private because I'm just building it for recordSelection. Can be made public if desired.
    private async getSessionById(sessionId: string): Promise<IRecommendationSessionDocument> {
        if (!Types.ObjectId.isValid(sessionId)) {
            throw new Error('Invalid recommendation session ID.');
        }

        const session = await this.recommendationHistoryRepo.findById(sessionId);

        if (!session) {
            throw new Error('Recommendation session ${sessionId} not found');
        }

        return session;
    }

    // Record user selection for recommendation session
    async recordSelection(
        sessionId: string,
        stationId: string,
        requestingUserId: string,
        updatedAt: Date,
    ) {
        // Basic validity checks
        if (!Types.ObjectId.isValid(sessionId)) {
            throw new Error('Invalid session ID.');
        }
        if (!Types.ObjectId.isValid(stationId)) {
            throw new Error('Invalid charging station ID');
        }
        if (!Types.ObjectId.isValid(requestingUserId)) {
            throw new Error('Invalid user ID');
        }

        // Try to retrieve session
        const session = await this.recommendationHistoryRepo.findById(sessionId);

        // Stop if session isn't found
        if (!session) {
            throw new Error('Recommendation session not found');
        }
        // Stop if session user doesn't match user passed from controller
        if (!session.userId.equals(requestingUserId)) {
            throw new Error('Session does not belong to requesting user.');
        }
        // Stop if stationId is not in the candidates list
        const candidateStationIds = session.candidates.map(candidate => candidate.stationId.toString());
        if (!candidateStationIds.includes(stationId)) {
            throw new Error('Selected station is not in the candidates list for this session.');
        }

        // Record the selection
        const updatedSession = await this.recommendationHistoryRepo.recordSelection(sessionId, stationId, updatedAt);
    }

    // Find recent N sessions by user
    async getRecentSessions(
        requestingUserId: string,
        limit = 10,
    ): Promise<IRecommendationSessionDocument[]> {

        // Basic validity checks
        if (!Types.ObjectId.isValid(requestingUserId)) {
            throw new Error('Invalid user ID');
        }
        if (!Number.isInteger(limit) || limit < 1) {
            throw new Error('Limit must be a positive integer.');
        }

        return this.recommendationHistoryRepo.findRecentByUser(requestingUserId, limit);
    }

}