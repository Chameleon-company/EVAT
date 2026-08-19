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
exports.UserStatsService = void 0;
const user_stats_repository_1 = __importDefault(require("../repositories/user-stats-repository"));
const achievement_service_1 = __importDefault(require("../services/achievement-service"));
// This service handles all the achievement system items
// It is the place to put calculations and derived values (like "1 year since joining")
// Extend as needed
// It is currently split into categories to manage service types
class UserStatsService {
    /**
     * Get current stats for a user
     *
     * @param userId String: a specific users ID
     * @returns UserStats: Returns the specified users stats
     */
    getStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_stats_repository_1.default.findByUserId(userId);
        });
    }
    /**
     * Ensure user stats document exists
     * Call this on user registration or first activity
     *
     * @param userId String: a specific users ID
     * @returns UserStats: Returns the specified users stats
     */
    initializeStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_stats_repository_1.default.upsertUserStats(userId);
        });
    }
    // ====================== CHARGING RELATED ======================
    /**
     * Record a completed charging session
     * ====== This is to mimick a charging session                            ======
     * ====== Needs proper implementation when sessions are added             ======
     *
     * @param userId String: a specific users ID
     * @param data Dictionary: the data that is being changed during a charge
     * @returns UserStats: Returns the specified users stats
     */
    recordChargingSession(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // create update data
            const updates = {
                totalChargeTimeSeconds: data.chargeTimeSeconds,
                totalWhCharged: data.whCharged,
                totalChargingSessions: 1,
            };
            // if distance travelled is provided
            if (data.metresTravelled) {
                updates.totalMetresTravelled = data.metresTravelled;
            }
            // if charging cost is provided
            if (data.chargingCostCents) {
                updates.totalChargingCostsCents = data.chargingCostCents;
            }
            // IMPORTANT
            // You can add derived calculations here (CO2, petrol savings, etc.)
            // Example:
            // updates.totalCO2KgAvoided = Math.round(data.whCharged * 0.0005); // rough factor
            // updates.totalPetrolSavingsCents = Math.round(data.whCharged * 0.015);
            // Update stats
            const updatedStats = yield user_stats_repository_1.default.incrementCounters(userId, updates);
            // Check for new achievements
            let newAchievements = [];
            if (updatedStats) {
                newAchievements = yield achievement_service_1.default.evaluateAndAwardAchievements(userId, [
                    "totalChargeTimeSeconds",
                    "totalWhCharged",
                    "totalChargingSessions",
                    "totalMetresTravelled",
                    "totalChargingCostsCents"
                ]);
            }
            return { stats: updatedStats, newAchievements };
        });
    }
    // ====================== LOGIN & STREAKS ======================
    /**
     * Record a user login + handle login streaks
     *
     * @param userId String: a specific users ID
     * @returns UserStats: Returns the specified users stats
     */
    recordLogin(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedStats = yield user_stats_repository_1.default.incrementCounters(userId, {
                totalLoginDays: 1,
                consecutiveLoginDays: 1,
            });
            // Check for new achievements
            let newAchievements = [];
            if (updatedStats) {
                newAchievements = yield achievement_service_1.default.evaluateAndAwardAchievements(userId, [
                    "totalLoginDays",
                    "consecutiveLoginDays"
                ]);
            }
            return { stats: updatedStats, newAchievements };
        });
    }
    // ====================== PROFILE & ONBOARDING ======================
    /**
     * Sets one time flags to true to specific stats
     *
     * @param userId String: a specific users ID
     * @returns UserStats: Returns the specified users stats
     */
    markProfilePicSet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Get current stats to check the existing value
            const currentStats = yield user_stats_repository_1.default.findByUserId(userId);
            // Early return if already set to true
            if (((_a = currentStats === null || currentStats === void 0 ? void 0 : currentStats.flags) === null || _a === void 0 ? void 0 : _a.setProfilePic) === true) {
                return { stats: currentStats, newAchievements: [] };
            }
            // Update the flag because it is currently false
            const updatedStats = yield user_stats_repository_1.default.setFlags(userId, { setProfilePic: true });
            // Evaluate and Award the Achievement
            let newAchievements = [];
            if (updatedStats) {
                newAchievements = yield achievement_service_1.default.evaluateAndAwardAchievements(userId, ["setProfilePic"]);
            }
            return { stats: updatedStats, newAchievements };
        });
    }
    markProfileVehicleSet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Get current stats to check the existing value
            const currentStats = yield user_stats_repository_1.default.findByUserId(userId);
            // Early return if already set to true
            if (((_a = currentStats === null || currentStats === void 0 ? void 0 : currentStats.flags) === null || _a === void 0 ? void 0 : _a.setProfileVehicle) === true) {
                return { stats: currentStats, newAchievements: [] };
            }
            // Update the flag because it is currently false
            const updatedStats = yield user_stats_repository_1.default.setFlags(userId, { setProfileVehicle: true });
            // Evaluate and Award the Achievement
            let newAchievements = [];
            if (updatedStats) {
                newAchievements = yield achievement_service_1.default.evaluateAndAwardAchievements(userId, ["setProfileVehicle"]);
            }
            return { stats: updatedStats, newAchievements };
        });
    }
    markFavouriteChargeSaved(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Get current stats to check the existing value
            const currentStats = yield user_stats_repository_1.default.findByUserId(userId);
            // Early return if already set to true
            if (((_a = currentStats === null || currentStats === void 0 ? void 0 : currentStats.flags) === null || _a === void 0 ? void 0 : _a.saveFavouriteCharger) === true) {
                return { stats: currentStats, newAchievements: [] };
            }
            // Update the flag because it is currently false
            const updatedStats = yield user_stats_repository_1.default.setFlags(userId, { saveFavouriteCharger: true });
            // Evaluate and Award the Achievement
            let newAchievements = [];
            if (updatedStats) {
                newAchievements = yield achievement_service_1.default.evaluateAndAwardAchievements(userId, ["saveFavouriteCharger"]);
            }
            return { stats: updatedStats, newAchievements };
        });
    }
    // ====================== REVIEWS & SOCIAL ======================
    /**
     * Adds increment values to specific stats
     *
     * @param userId String: a specific users ID
     * @returns UserStats: Returns the specified users stats
     */
    recordReviewWritten(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedStats = yield user_stats_repository_1.default.incrementCounters(userId, {
                totalReviewsWritten: 1,
            });
            // Check for new achievements
            let newAchievements = [];
            if (updatedStats) {
                newAchievements = yield achievement_service_1.default.evaluateAndAwardAchievements(userId, ["totalReviewsWritten"]);
            }
            return { stats: updatedStats, newAchievements };
        });
    }
    recordRatingGiven(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedStats = yield user_stats_repository_1.default.incrementCounters(userId, {
                totalRatingsGiven: 1,
            });
            // Check for new achievements
            let newAchievements = [];
            if (updatedStats) {
                newAchievements = yield achievement_service_1.default.evaluateAndAwardAchievements(userId, ["totalRatingsGiven"]);
            }
            return { stats: updatedStats, newAchievements };
        });
    }
    // TESTING HELPERS - direct access to user stats and resets stats
    incrementCounters(userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedStats = yield user_stats_repository_1.default.incrementCounters(userId, updates);
            if (updatedStats) {
                yield achievement_service_1.default.evaluateAndAwardAchievements(userId, Object.keys(updates));
            }
            return updatedStats;
        });
    }
    setFlags(userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedStats = yield user_stats_repository_1.default.setFlags(userId, updates);
            if (updatedStats) {
                yield achievement_service_1.default.evaluateAndAwardAchievements(userId, Object.keys(updates));
            }
            return updatedStats;
        });
    }
    resetAllStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_stats_repository_1.default.resetAll(userId);
        });
    }
    resetCounters(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_stats_repository_1.default.resetCounters(userId);
        });
    }
    resetFlags(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_stats_repository_1.default.resetFlags(userId);
        });
    }
}
exports.UserStatsService = UserStatsService;
exports.default = new UserStatsService();
