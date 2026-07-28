import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";
import EnvImpactAnalysisController from "../controllers/env-impact-analysis-controller";
import EnvImpactAnalysisService from "../services/env-impact-analysis-service";

const router = Router();
const envImpactAnalysisService = new EnvImpactAnalysisService();
const envImpactAnalysisController = new EnvImpactAnalysisController(
  envImpactAnalysisService
);

/**
 * @swagger
 * components:
 *   schemas:
 *     EnvImpactRequest:
 *       type: object
 *       required:
 *         - evVehicleId
 *         - iceVehicleId
 *       properties:
 *         evVehicleId:
 *           type: string
 *           description: MongoDB ObjectId of the EV vehicle in `ev_vehicles`
 *           example: "66d7e0f5cdf87e8b5d63de69"
 *         iceVehicleId:
 *           type: string
 *           description: MongoDB ObjectId of the ICE vehicle in `ice_vehicle`
 *           example: "69c24f33220016a8b3e1adc0"
 *     EnvImpactResponse:
 *       type: object
 *       properties:
 *         ev:
 *           type: object
 *         ice:
 *           type: object
 *         comparison:
 *           type: object
 */

/**
 * @swagger
 * /api/env-impact-analysis/compare:
 *   post:
 *     tags:
 *       - Environmental Impact
 *     summary: Compare EV vs ICE environmental impact
 *     description: |
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnvImpactRequest'
 *           example:
 *             evVehicleId: "66d7e0f5cdf87e8b5d63de69"
 *             iceVehicleId: "69c24f33220016a8b3e1adc0"
 *     responses:
 *       200:
 *         description: Comparison retrieved successfully
 *       400:
 *         description: Bad request - missing ids, non-string ids, or invalid MongoDB ObjectId format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found or invalid type
 *       500:
 *         description: Server error
 */
router.post("/compare", authGuard(["user", "admin"]), (req, res) =>
  envImpactAnalysisController.compare(req, res)
);

export default router;

