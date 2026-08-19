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
exports.AchievementService = void 0;
const achievement_repository_1 = __importDefault(require("../repositories/achievement-repository"));
const user_stats_service_1 = __importDefault(require("./user-stats-service"));
class AchievementService {
    /**
     * Evaluate achievements and return only the newly unlocked ones
     */
    checkForNewAchievements(userId, changedStatNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const newlyUnlocked = yield this.evaluateAndAwardAchievements(userId, changedStatNames);
            if (newlyUnlocked.length === 0)
                return [];
            // Return rich data for frontend
            return newlyUnlocked.map(ach => ({
                id: ach._id.toString(),
                name: ach.name,
                description: ach.description,
                icon: ach.icon,
                rarity: ach.rarity,
                points: ach.points,
                unlockedAt: new Date(),
            }));
        });
    }
    /**
     * Main evaluation function
     * Call this after any stat update
    */
    evaluateAndAwardAchievements(userId, changedStatNames // e.g. ["setProfilePic", "totalChargingSessions"]
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const newlyUnlocked = [];
            // For MVP: Fetch all active achievements
            const allAchievements = yield achievement_repository_1.default.getAllActiveAchievements();
            const currentStats = yield user_stats_service_1.default.getStats(userId);
            if (!currentStats)
                return [];
            for (const achievement of allAchievements) {
                const { milestone } = achievement;
                const statName = milestone.statName;
                // Only evaluate achievements related to the stats that just changed
                if (!changedStatNames.includes(statName)) {
                    continue;
                }
                // Skip if user already has this achievement
                const alreadyHas = yield achievement_repository_1.default.hasAchievement(userId, achievement._id.toString());
                if (alreadyHas)
                    continue;
                // Evaluate milestone
                let isUnlocked = false;
                if (milestone.statType === "flag") {
                    const flagValue = currentStats.flags[statName];
                    isUnlocked = flagValue === milestone.targetValue;
                }
                else if (milestone.statType === "counter") {
                    const counterValue = currentStats.counters[statName];
                    if (milestone.operator === ">=") {
                        isUnlocked = counterValue >= Number(milestone.targetValue);
                    }
                }
                if (isUnlocked) {
                    yield achievement_repository_1.default.awardAchievement(userId, achievement);
                    newlyUnlocked.push(achievement);
                }
            }
            return newlyUnlocked;
        });
    }
    /** Get all unlocked achievements for a user (for frontend) */
    getUserAchievements(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return achievement_repository_1.default.getUserUnlockedAchievements(userId);
        });
    }
    /**
     * Get ALL active achievements (for frontend to show locked + unlocked)
     */
    getAllAchievements() {
        return __awaiter(this, void 0, void 0, function* () {
            const allAchievements = yield achievement_repository_1.default.getAllActiveAchievements();
            return allAchievements.map(achievement => (Object.assign(Object.assign({}, achievement.toObject()), { _id: achievement._id.toString() })));
        });
    }
    /**
     * Get ALL achievements with unlock status for a specific user
     * Best endpoint for frontend achievement gallery
     */
    getAllAchievementsWithProgress(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const allAchievements = yield achievement_repository_1.default.getAllActiveAchievements();
            const unlockedList = yield achievement_repository_1.default.getUserUnlockedAchievements(userId);
            // Use a Map for fast lookup of both ID and unlockedAt
            const unlockedMap = new Map(unlockedList.map(item => [item.achievementId, item.unlockedAt]));
            return allAchievements.map(achievement => {
                const achievementId = achievement._id.toString();
                const unlockedAt = unlockedMap.get(achievementId);
                return Object.assign(Object.assign({}, achievement.toObject()), { _id: achievementId, unlocked: unlockedAt !== undefined, unlockedAt: unlockedAt || null });
            });
        });
    }
    /**
     * Get the N (default 6) most recently unlocked achievements for a user
     */
    getRecentUnlockedAchievements(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 6) {
            const recent = yield achievement_repository_1.default.getUserUnlockedAchievements(userId);
            // Sort by unlockedAt (newest first) and limit
            return recent
                .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
                .slice(0, limit);
        });
    }
}
exports.AchievementService = AchievementService;
exports.default = new AchievementService();
