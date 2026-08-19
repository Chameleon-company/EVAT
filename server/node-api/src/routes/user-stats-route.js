"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_stats_controller_1 = __importDefault(require("../controllers/user-stats-controller"));
const user_stats_service_1 = __importDefault(require("../services/user-stats-service"));
const auth_middleware_1 = require("../middlewares/auth-middleware");
const router = (0, express_1.Router)();
const userStatController = new user_stats_controller_1.default(user_stats_service_1.default);
/**
 * @swagger
 * /api/user-stats/me:
 *   get:
 *     tags:
 *       - User Stats
 *     summary: Get authenticated user's stats
 *     description: Retrieve all counters, flags, and lastUpdated timestamp for the currently logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     counters:
 *                       type: object
 *                     flags:
 *                       type: object
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User stats not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => userStatController.getMyStats(req, res));
/**
 * @swagger
 * /api/user-stats/initialize:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Initialize user stats document
 *     description: Creates a user_stats document if one does not exist (usually called after registration)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User stats initialized successfully
 *       400:
 *         description: Bad request - userId missing
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/initialize", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => userStatController.initializeStats(req, res));
// ===============================================================================================
//                          DEVELOPER ONLY ROUTES (for testing)
// ===============================================================================================
/**
 * @swagger
 * /api/user-stats/reset:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Reset all user stats (Development only)
 *     description: Resets all counters to 0 and flags to false. Intended for testing and development only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All stats reset successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
if (process.env.NODE_ENV !== "production") {
    router.post("/reset", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => userStatController.resetAllStats(req, res));
}
/**
 * @swagger
 * /api/user-stats/reset-counters:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Reset all user stat counters (Development only)
 *     description: Resets all counters to 0. Intended for testing and development only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All counters reset successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
if (process.env.NODE_ENV !== "production") {
    router.post("/reset-counters", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => userStatController.resetCounters(req, res));
}
/**
 * @swagger
 * /api/user-stats/reset-flags:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Reset all user stat flags (Development only)
 *     description: Resets all flags to false. Intended for testing and development only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All flags reset successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
if (process.env.NODE_ENV !== "production") {
    router.post("/reset-flags", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => userStatController.resetFlags(req, res));
}
/**
 * @swagger
 * /api/user-stats/test/increment:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Adds a value to a user stat counter (Development only)
 *     description: Adds a given value to the user stat counter with the matching name. Intended for testing and development only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Counter successfully changed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
if (process.env.NODE_ENV !== "production") {
    router.post("/test/increment", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => userStatController.testIncrementCounter(req, res));
}
/**
 * @swagger
 * /api/user-stats/test/set-flag:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Sets a user stat flag to true (Development only)
 *     description: Sets user stat flag with the matching name to true. Intended for testing and development only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flags successfully changed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
if (process.env.NODE_ENV !== "production") {
    router.post("/test/set-flag", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => userStatController.testSetFlag(req, res));
}
exports.default = router;
