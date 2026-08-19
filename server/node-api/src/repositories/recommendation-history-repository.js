"use strict";
// Database operations for recommendation history
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
const recommendation_history_model_1 = __importDefault(require("../models/recommendation-history-model"));
const mongoose_1 = require("mongoose");
class RecommendationHistoryRepository {
    // Save a newly generated recommendation session.
    create(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = new recommendation_history_model_1.default(sessionData);
            return yield session.save();
        });
    }
    // Find recommendation session by ID.
    findById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield recommendation_history_model_1.default.findById(sessionId).exec();
        });
    }
    // Find a user's recent recommendation sessions
    findRecentByUser(userId, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield recommendation_history_model_1.default.find({
                userId: new mongoose_1.Types.ObjectId(userId),
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .exec();
        });
    }
    // Record the candidate station selected by the user.
    recordSelection(sessionId_1, stationId_1) {
        return __awaiter(this, arguments, void 0, function* (sessionId, stationId, selectedAt = new Date()) {
            return yield recommendation_history_model_1.default.findByIdAndUpdate(sessionId, {
                $set: {
                    'selection.stationId': new mongoose_1.Types.ObjectId(stationId),
                    'selection.selectedAt': selectedAt,
                },
            }, {
                new: true,
                runValidators: true,
            }).exec();
        });
    }
}
exports.default = RecommendationHistoryRepository;
