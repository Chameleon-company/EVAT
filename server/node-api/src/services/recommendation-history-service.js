"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import repository, model interfaces and mongoose
const mongoose_1 = require("mongoose");
class RecommendationHistoryService {
    // Instantiate the repo
    constructor(recommendationHistoryRepo) {
        this.recommendationHistoryRepo = recommendationHistoryRepo;
    }
    // Create recommendation session
    createSession(recSession) {
        return __awaiter(this, void 0, void 0, function* () {
            // Checking data is valid before creating DB record
            if (!mongoose_1.Types.ObjectId.isValid(recSession.userId)) {
                throw new Error('A valid user ID is required.');
            }
            if (!recSession.userLocation) {
                throw new Error('User location is required.');
            }
            if (!Array.isArray(recSession.candidates)) {
                throw new Error('Candidates must be an array of ');
            }
            // Create the session in the database
            const session = yield this.recommendationHistoryRepo.create({
                userId: new mongoose_1.Types.ObjectId(recSession.userId),
                userLocation: recSession.userLocation,
                candidates: recSession.candidates,
                selection: {
                    stationId: null,
                    selectedAt: null,
                },
            });
            // Return the sessionId
            return session._id;
        });
    }
    // Private because I'm just building it for recordSelection. Can be made public if desired.
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                throw new Error('Invalid recommendation session ID.');
            }
            const session = yield this.recommendationHistoryRepo.findById(sessionId);
            if (!session) {
                throw new Error('Recommendation session ${sessionId} not found');
            }
            return session;
        });
    }
    // Record user selection for recommendation session
    recordSelection(sessionId, stationId, requestingUserId, updatedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            // Basic validity checks
            if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                throw new Error('Invalid session ID.');
            }
            if (!mongoose_1.Types.ObjectId.isValid(stationId)) {
                throw new Error('Invalid charging station ID');
            }
            if (!mongoose_1.Types.ObjectId.isValid(requestingUserId)) {
                throw new Error('Invalid user ID');
            }
            // Try to retrieve session
            const session = yield this.recommendationHistoryRepo.findById(sessionId);
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
            const updatedSession = yield this.recommendationHistoryRepo.recordSelection(sessionId, stationId, updatedAt);
        });
    }
    // Find recent N sessions by user
    getRecentSessions(requestingUserId_1) {
        return __awaiter(this, arguments, void 0, function* (requestingUserId, limit = 10) {
            // Basic validity checks
            if (!mongoose_1.Types.ObjectId.isValid(requestingUserId)) {
                throw new Error('Invalid user ID');
            }
            if (!Number.isInteger(limit) || limit < 1) {
                throw new Error('Limit must be a positive integer.');
            }
            return this.recommendationHistoryRepo.findRecentByUser(requestingUserId, limit);
        });
    }
}
exports.default = RecommendationHistoryService;
