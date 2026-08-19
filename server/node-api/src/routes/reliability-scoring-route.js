"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth-middleware");
const reliability_scoring_service_1 = __importDefault(require("../services/reliability-scoring-service"));
const reliability_scoring_controller_1 = __importDefault(require("../controllers/reliability-scoring-controller"));
const router = (0, express_1.Router)();
const reliabilityScoringService = new reliability_scoring_service_1.default();
const reliabilityScoringController = new reliability_scoring_controller_1.default(reliabilityScoringService);
/**
 * Node proxy for Reliability Scoring FastAPI (RELIABILITY_API_URL).
 *
 * Python                    Node
 * ----------------------    -------------------------------------
 * GET  /health           →  GET  /api/reliability/health
 * GET  /suburbs          →  GET  /api/reliability/suburbs
 * GET  /summary          →  GET  /api/reliability/summary
 * GET  /stations         →  GET  /api/reliability/stations
 * GET  /stations/{id}    →  GET  /api/reliability/stations/:id
 * GET  /top              →  GET  /api/reliability/top
 * POST /score            →  POST /api/reliability/score
 * POST /score/batch      →  POST /api/reliability/score/batch
 * POST /sentiment        →  POST /api/reliability/sentiment
 */
/**
 * @swagger
 * /api/reliability/health:
 *   get:
 *     tags: [Reliability Scoring]
 *     summary: Health check (proxies GET /health)
 *     responses:
 *       200:
 *         description: Service status and data load state
 *       503:
 *         description: Python service unreachable
 */
router.get("/health", (req, res) => {
    reliabilityScoringController.getHealth(req, res);
});
/**
 * @swagger
 * /api/reliability/suburbs:
 *   get:
 *     tags: [Reliability Scoring]
 *     summary: List suburbs for filters
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: suburbs array
 */
router.get("/suburbs", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.getSuburbs(req, res);
});
/**
 * @swagger
 * /api/reliability/summary:
 *   get:
 *     tags: [Reliability Scoring]
 *     summary: KPI summary (stations, uptime, reliability, sentiment counts)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: suburb
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary metrics
 */
router.get("/summary", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.getSummary(req, res);
});
/**
 * @swagger
 * /api/reliability/stations:
 *   get:
 *     tags: [Reliability Scoring]
 *     summary: List scored stations with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: suburb
 *         schema:
 *           type: string
 *       - in: query
 *         name: sentiment
 *         schema:
 *           type: string
 *           enum: [Positive, Neutral, Negative, All]
 *       - in: query
 *         name: min_score
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: stations, count, total
 */
router.get("/stations", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.getStations(req, res);
});
/**
 * @swagger
 * /api/reliability/stations/{id}:
 *   get:
 *     tags: [Reliability Scoring]
 *     summary: Get a single station by charger id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: MEL001
 *     responses:
 *       200:
 *         description: Station record
 *       404:
 *         description: Not found
 */
router.get("/stations/:id", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.getStation(req, res);
});
/**
 * @swagger
 * /api/reliability/top:
 *   get:
 *     tags: [Reliability Scoring]
 *     summary: Top stations by sentiment or reliability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kind
 *         schema:
 *           type: string
 *           enum: [positive, negative, neutral, reliability]
 *       - in: query
 *         name: suburb
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top station list
 */
router.get("/top", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.getTop(req, res);
});
/**
 * @swagger
 * /api/reliability/score:
 *   post:
 *     tags: [Reliability Scoring]
 *     summary: Score one station (status * 0.6 + power * 0.4)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, power_kw]
 *             properties:
 *               station_id:
 *                 oneOf: [{ type: string }, { type: number }]
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 example: Operational
 *               power_kw:
 *                 type: number
 *                 example: 150
 *               max_power_kw:
 *                 type: number
 *                 example: 350
 *     responses:
 *       200:
 *         description: status_score, power_score, reliability_score
 *       400:
 *         description: Bad request
 *       503:
 *         description: Python service unreachable
 */
router.post("/score", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.score(req, res);
});
/**
 * @swagger
 * /api/reliability/score/batch:
 *   post:
 *     tags: [Reliability Scoring]
 *     summary: Batch reliability scores
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [records]
 *             properties:
 *               max_power_kw:
 *                 type: number
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [status, power_kw]
 *                   properties:
 *                     station_id:
 *                       oneOf: [{ type: string }, { type: number }]
 *                     name:
 *                       type: string
 *                     status:
 *                       type: string
 *                     power_kw:
 *                       type: number
 *     responses:
 *       200:
 *         description: scores, count, timestamp
 */
router.post("/score/batch", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.scoreBatch(req, res);
});
/**
 * @swagger
 * /api/reliability/sentiment:
 *   post:
 *     tags: [Reliability Scoring]
 *     summary: VADER sentiment for feedback text
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: Fantastic experience! Smooth and quick charging.
 *     responses:
 *       200:
 *         description: sentiment_score, sentiment_label
 */
router.post("/sentiment", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => {
    reliabilityScoringController.analyzeSentiment(req, res);
});
exports.default = router;
