"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voice_controller_1 = __importDefault(require("../controllers/voice-controller"));
const voice_service_1 = __importDefault(require("../services/voice-service"));
const router = (0, express_1.Router)();
const voiceService = new voice_service_1.default();
const voiceController = new voice_controller_1.default(voiceService);
/**
 * @swagger
 * /api/voice/query:
 *   post:
 *     tags:
 *       - Voice
 *     summary: Process a voice assistant query
 *     description: Returns interpreted intent, entities, assistant response, and optional station reference for map highlighting.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: "What is the congestion at station central?"
 *     responses:
 *       200:
 *         description: Voice query handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer_text:
 *                   type: string
 *                 intent:
 *                   type: string
 *                   example: get_congestion
 *                 entities:
 *                   type: object
 *                 station_id:
 *                   type: string
 *                   nullable: true
 *                   example: station-central
 *                 coordinates:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post("/query", (req, res) => voiceController.query(req, res));
exports.default = router;
