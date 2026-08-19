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
class AchievementController {
    constructor(achievementService) {
        this.achievementService = achievementService;
    }
    /**
     * GET /api/achievements/me
     * Get all unlocked achievements for the authenticated user
     */
    getMyAchievements(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized - No user ID found" });
                }
                const unlockedAchievements = yield this.achievementService.getUserAchievements(userId);
                return res.status(200).json({
                    message: "success",
                    count: unlockedAchievements.length,
                    data: unlockedAchievements,
                });
            }
            catch (error) {
                console.error("getMyAchievements error:", error);
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
     * GET /api/achievements/all
     * Get all available achievements in the system (for frontend display of locked ones)
     * Useful for showing progress / full achievement list
     */
    getAllAchievements(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const allAchievements = yield this.achievementService.getAllAchievements();
                return res.status(200).json({
                    message: "success",
                    count: allAchievements.length,
                    data: allAchievements,
                });
            }
            catch (error) {
                console.error("getAllAchievements error:", error);
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
   * GET /api/achievements
   * Get ALL achievements with user's unlock status (Recommended main endpoint)
   */
    getAchievementsWithProgress(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                const achievementsWithProgress = yield this.achievementService.getAllAchievementsWithProgress(userId);
                return res.status(200).json({
                    message: "success",
                    count: achievementsWithProgress.length,
                    data: achievementsWithProgress,
                });
            }
            catch (error) {
                console.error("getAchievementsWithProgress error:", error);
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
     * GET /api/achievements/me-recent
     * Get the N most recently unlocked achievements
     */
    getRecentAchievements(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                // Support ?limit=10 query parameter
                const limit = parseInt(req.query.limit) || 6;
                // Clamp between 1 and 20
                const clampedLimit = Math.min(Math.max(limit, 1), 20);
                const recentAchievements = yield this.achievementService.getRecentUnlockedAchievements(userId, clampedLimit);
                return res.status(200).json({
                    message: "success",
                    count: recentAchievements.length,
                    data: recentAchievements,
                });
            }
            catch (error) {
                console.error("getRecentAchievements error:", error);
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
}
exports.default = AchievementController;
