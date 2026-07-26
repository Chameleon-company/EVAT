import { Router } from "express";
import VoiceController from "../controllers/voice-controller";
import VoiceService from "../services/voice-service";

const router = Router();
const voiceService = new VoiceService();
const voiceController = new VoiceController(voiceService);

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

export default router;
