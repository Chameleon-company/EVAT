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
// Between controller and repository (bussiness layer to validate data before going to repository)
const mongoose_1 = require("mongoose");
class ChargerSessionService {
    // Constructor
    constructor(sessionRepo) {
        this.sessionRepo = sessionRepo;
    }
    // Create a new session
    createSession(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simple exist check
            if (!sessionData.userId || !sessionData.stationId) {
                throw new Error('User ID or Station ID are required to start a session.');
            }
            // Convert string IDs to ObjectId
            const userObjectId = new mongoose_1.Types.ObjectId(sessionData.userId);
            const stationObjectId = new mongoose_1.Types.ObjectId(sessionData.stationId);
            // Set status and default start time object
            const toCreate = {
                userId: userObjectId,
                stationId: stationObjectId,
                status: sessionData.status || 'in_progress',
                startTime: sessionData.startTime || new Date(),
            };
            return yield this.sessionRepo.create(toCreate);
        });
    }
    // End a session by ID
    endSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionRepo.findById(sessionId);
            if (!session) {
                throw new Error(`Session with ID ${sessionId} not found.`);
            }
            if (session.endTime) {
                throw new Error('Session is already ended.');
            }
            const now = new Date();
            const updatedSession = yield this.sessionRepo.endSession(sessionId, now);
            // Safeguard temp code for null
            if (!updatedSession) {
                throw new Error('Failed to update session.');
            }
            return updatedSession;
        });
    }
    // Get a single session by ID
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionRepo.findById(sessionId);
            if (!session) {
                throw new Error(`Session with ID ${sessionId} not found.`);
            }
            return session;
        });
    }
    // Get sessions for a user
    getSessionsByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionRepo.findByUser(userId);
        });
    }
    // Get sessions for a station
    getSessionsByStation(stationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionRepo.findByStation(stationId);
        });
    }
    // Stream sessions using MongoDB Change Stream
    streamSessions(callback) {
        const changeStream = this.sessionRepo.watch();
        changeStream.on('change', (change) => {
            var _a, _b;
            const operationType = change.operationType;
            // Event object depending on the operations (insert/update vs delete)
            if ('fullDocument' in change && change.fullDocument) {
                const fullDoc = change.fullDocument;
                callback({
                    sessionId: change.documentKey._id.toString(),
                    userId: (_a = fullDoc.userId) === null || _a === void 0 ? void 0 : _a.toString(),
                    stationId: (_b = fullDoc.stationId) === null || _b === void 0 ? void 0 : _b.toString(),
                    status: fullDoc.status,
                    timestamp: new Date(),
                    operationType,
                    energyDelivered: fullDoc.energyDelivered,
                    cost: fullDoc.cost,
                });
            }
            else if (operationType === 'delete') {
                const deleteChange = change;
                callback({
                    sessionId: deleteChange.documentKey._id.toString(),
                    userId: '',
                    stationId: '',
                    status: 'deleted',
                    timestamp: new Date(),
                    operationType,
                });
            }
        });
    }
    // Grab the historical logs
    getLogs() {
        return __awaiter(this, arguments, void 0, function* (filter = {}, limit = 100, skip = 0) {
            return this.sessionRepo.findLogs(filter, limit, skip);
        });
    }
}
exports.default = ChargerSessionService;
