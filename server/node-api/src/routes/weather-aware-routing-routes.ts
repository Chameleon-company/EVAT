import express from "express";
import WeatherAwareRoutingController from "../controllers/weather-aware-routing-controller";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WeatherAwareRoutingResponse:
 *       type: object
 *       properties:
 *         prediction:
 *           type: number
 *         dist_to_nearest_ev_m:
 *           type: number
 *         ev_within_500m:
 *           type: number
 *         avg_temp:
 *           type: number
 *         total_prcp:
 *           type: number
 *         used_SHAPE_Length:
 *           type: number
 *     WeatherAwareRoutingLocation:
 *       type: object
 *       properties:
 *         year:
 *           type: number
 *         start_lat:
 *           type: number
 *         start_lon:
 *           type: number
 */
/**
 * @swagger
 * /api/weather-aware-routing/predict:
 *   post:
 *     tags:
 *       - Weather Aware Routing
 *     summary:
 *       Predict energy consumption
 *     description:
 *       Predicts energy consumption of driving to location and other data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - start_lat
 *               - start_lon
 *             properties:
 *               year:
 *                 type: number
 *                 example: 2023
 *                 maxLength: 4
 *               start_lat:
 *                 type: number
 *                 example: -37.814
 *                 maxLength: 16
 *               start_lon:
 *                 type: number
 *                 example: 144.96205
 *                 maxLength: 16
 *     responses:
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "year, start_lat and start_lon are required"
 *       201:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prediction:
 *                   type: number
 *                 dist_to_nearest_ev_m:
 *                   type: number
 *                 ev_within_500m:
 *                   type: number
 *                 avg_temp:
 *                   type: number
 *                 total_prcp:
 *                   type: number
 *                 used_SHAPE_Length:
 *                   type: number
 *       500:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post("/predict", WeatherAwareRoutingController.predict);

export default router;