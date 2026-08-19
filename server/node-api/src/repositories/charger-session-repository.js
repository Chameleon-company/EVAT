"use strict";
// Db operations (CRUD) with Mongoose
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import interface for charging session model
const charger_session_model_1 = __importDefault(require("../models/charger-session-model"));
const mongoose_1 = require("mongoose");
class ChargerSessionRepository {
    // Create a new charging session
    create(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = new charger_session_model_1.default(sessionData);
            return yield session.save();
        });
    }
    // Find a session by ID
    findById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield charger_session_model_1.default.findById(sessionId)
                // Fill in User and Station info
                .populate('userId')
                .populate('stationId');
        });
    }
    // End a session by setting endTime and status
    endSession(sessionId, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield charger_session_model_1.default.findByIdAndUpdate(sessionId, {
                endTime,
                status: 'completed',
            }, { new: true });
        });
    }
    // Get all sessions for a specific user
    findByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield charger_session_model_1.default.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ startTime: -1 });
        });
    }
    // Get all sessions for a specific station
    findByStation(stationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield charger_session_model_1.default.find({ stationId: new mongoose_1.Types.ObjectId(stationId) }).sort({ startTime: -1 });
        });
    }
    // Expose MongoDB Change Stream (return what MongoDB give out)
    watch(pipeline = []) {
        return charger_session_model_1.default.watch(pipeline, { fullDocument: 'updateLockup' });
    }
    // Find the historical logs for DS pipelines and admin queries
    findLogs() {
        return __awaiter(this, arguments, void 0, function* (filter = {}, limit = 100, skip = 0) {
            return charger_session_model_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
        });
    }
}
exports.default = ChargerSessionRepository;
