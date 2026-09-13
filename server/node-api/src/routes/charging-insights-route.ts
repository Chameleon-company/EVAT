/**
 * Charging Insights Routes
 * Endpoints for retrieving charging station occupancy insights
 */

import express from 'express';
import ChargerInsightsController from '../controllers/charger-insights-controller';
import ChargingInsightsService from '../services/charger-insights-service';
import ChargerSessionRepository from '../repositories/charger-session-repository';

// Initialize router
const router = express.Router();

// Setup: controller -> service -> repository
const chargerSessionRepository = new ChargerSessionRepository();
const chargingInsightsService = new ChargingInsightsService(chargerSessionRepository);
const chargerInsightsController = new ChargerInsightsController(chargingInsightsService);

/**
 * @swagger
 * /api/v1/insights/station/{stationId}:
 *   get:
 *     summary: Get charging insights for a single station
 *     description: Retrieve occupancy insights and recommendations for a specific charging station
 *     tags:
 *       - Insights
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charging station
 *       - in: query
 *         name: daysBack
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days of historical data to analyze (1-365)
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stationId:
 *                       type: string
 *                     occupancyByHour:
 *                       type: array
 *                     predictions:
 *                       type: object
 *                     recommendation:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/station/:stationId',
  (req, res) => chargerInsightsController.getStationInsights(req, res)
);

/**
 * @swagger
 * /api/v1/insights/stations:
 *   post:
 *     summary: Get charging insights for multiple stations
 *     description: Retrieve occupancy insights for multiple charging stations in a single request
 *     tags:
 *       - Insights
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stationIds
 *             properties:
 *               stationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of station IDs (max 50)
 *                 example: ["id1", "id2", "id3"]
 *               daysBack:
 *                 type: integer
 *                 default: 30
 *                 description: Number of days of historical data (1-365)
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                 count:
 *                   type: integer
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post(
  '/stations',
  (req, res) => chargerInsightsController.getBulkInsights(req, res)
);

export default router;
