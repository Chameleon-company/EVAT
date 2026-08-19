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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementRepository = void 0;
const achievement_model_1 = __importDefault(require("../models/achievement-model"));
const user_achievement_model_1 = __importDefault(require("../models/user-achievement-model"));
class AchievementRepository {
    /** Get all active achievements */
    getAllActiveAchievements() {
        return __awaiter(this, void 0, void 0, function* () {
            return achievement_model_1.default.find({ isActive: true });
        });
    }
    /** Get achievements that watch a specific stat */
    getAchievementsByStat(statName) {
        return __awaiter(this, void 0, void 0, function* () {
            return achievement_model_1.default.find({
                "milestone.statName": statName,
                isActive: true
            });
        });
    }
    /** Check if user already has this achievement */
    hasAchievement(userId, achievementId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield user_achievement_model_1.default.countDocuments({ userId, achievementId });
            return count > 0;
        });
    }
    /** Award an achievement to a user */
    awardAchievement(userId, achievement) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_achievement_model_1.default.create({
                userId,
                achievementId: achievement._id,
                pointsAwarded: achievement.points || 10,
            });
        });
    }
    /** Get all unlocked achievements for a user */
    getUserUnlockedAchievements(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_achievement_model_1.default.find({ userId }).sort({ unlockedAt: -1 });
        });
    }
}
exports.AchievementRepository = AchievementRepository;
exports.default = new AchievementRepository();
