import { Router } from "express";
import NearbyPlaceController from "../controllers/nearby-place-controller";
import NearbyPlaceService from "../services/nearby-place-service";
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const nearbyPlaceController = new NearbyPlaceController(new NearbyPlaceService());
const requireUserOrAdmin = authGuard(["user", "admin"]);

/**
 * @swagger
 * /api/nearby-places:
 *   get:
 *     tags:
 *       - Nearby Places
 *     summary: Find restaurants and stores near a location
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, food, shopping]
 *     responses:
 *       200:
 *         description: Nearby places retrieved successfully
 *       401:
 *         description: Missing or invalid token
 */
router.get("/", requireUserOrAdmin, (req, res) => nearbyPlaceController.getNearby(req, res));

/**
 * @swagger
 * /api/nearby-places/photo:
 *   get:
 *     tags:
 *       - Nearby Places
 *     summary: Proxy a Google Places photo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Place photo image
 *       400:
 *         description: Invalid photo name
 *       401:
 *         description: Missing or invalid token
 */
router.get("/photo", requireUserOrAdmin, (req, res) => nearbyPlaceController.getPhoto(req, res));

/**
 * @swagger
 * /api/nearby-places/station/{stationId}:
 *   get:
 *     tags:
 *       - Nearby Places
 *     summary: Find restaurants and stores near a charging station
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, food, shopping]
 *     responses:
 *       200:
 *         description: Nearby places retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Charging station not found
 */
router.get("/station/:stationId", requireUserOrAdmin, (req, res) =>
  nearbyPlaceController.getNearbyForStation(req, res)
);

export default router;
