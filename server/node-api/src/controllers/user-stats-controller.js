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
class UserStatsController {
    constructor(userStatsService) {
        this.userStatsService = userStatsService;
    }
    /**
     * GET /api/user-stats/me
     * Get the authenticated user's stats
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getMyStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized - No user ID found" });
                }
                const stats = yield this.userStatsService.getStats(userId);
                if (!stats) {
                    return res.status(404).json({ message: "User stats not found" });
                }
                return res.status(200).json({
                    message: "success",
                    data: stats,
                });
            }
            catch (error) {
                console.error("getMyStats error:", error);
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
     * POST /api/user-stats/initialize
     * Initialize stats for a user
     * Called during registration
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    initializeStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) || req.body.userId;
                if (!userId) {
                    return res.status(400).json({ message: "userId is required" });
                }
                const stats = yield this.userStatsService.initializeStats(userId);
                return res.status(201).json({
                    message: "User stats initialized successfully",
                    data: stats,
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    // ===============================================================================================
    //                          DEVELOPER ONLY (for testing)
    // ===============================================================================================
    /**
     * POST /api/user-stats/reset (Development / Testing only)
     * Reset all stats for the current user
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    resetAllStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                const stats = yield this.userStatsService.resetAllStats(userId);
                return res.status(200).json({
                    message: "All stats have been reset successfully",
                    data: stats,
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
     * POST /api/user-stats/reset-counters (Development / Testing only)
     * Reset all counters for the current user
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    resetCounters(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                const stats = yield this.userStatsService.resetCounters(userId);
                return res.status(200).json({
                    message: "All counters have been reset successfully",
                    data: stats,
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
     * POST /api/user-stats/reset-flags (Development / Testing only)
     * Reset all flags for the current user
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    resetFlags(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                const stats = yield this.userStatsService.resetFlags(userId);
                return res.status(200).json({
                    message: "All flags have been reset successfully",
                    data: stats,
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
     * POST /api/user-stats/test/increment (Development / Testing only)
     * Developer tool: Increment a counter
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    testIncrementCounter(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, counterName, value = 1 } = req.body;
                if (!userId || !counterName) {
                    return res.status(400).json({ message: "userId and counterName are required" });
                }
                const updates = { [counterName]: Number(value) };
                const stats = yield this.userStatsService.incrementCounters(userId, updates);
                return res.status(200).json({
                    message: `Successfully added ${value} to ${counterName}`,
                    data: stats
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
    /**
     * POST /api/user-stats/test/set-flag (Development / Testing only)
     * Developer tool: Set a flag to true
     *
     * @param req Request object containing the authenticated user
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    testSetFlag(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, flagName } = req.body;
                if (!userId || !flagName) {
                    return res.status(400).json({ message: "userId and flagName are required" });
                }
                const stats = yield this.userStatsService.setFlags(userId, { [flagName]: true });
                return res.status(200).json({
                    message: `Successfully set ${flagName} to true`,
                    data: stats
                });
            }
            catch (error) {
                return res.status(500).json({ message: error.message || "Internal server error" });
            }
        });
    }
}
exports.default = UserStatsController;
