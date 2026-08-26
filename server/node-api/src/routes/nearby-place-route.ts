import { Router } from "express";
import NearbyPlaceController from "../controllers/nearby-place-controller";
import NearbyPlaceService from "../services/nearby-place-service";

const router = Router();
const nearbyPlaceController = new NearbyPlaceController(new NearbyPlaceService());

/**
 * @swagger
 * /api/nearby-places:
 *   get:
 *     tags:
 *       - Nearby Places
 *     summary: Find restaurants and stores near a location
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
 */
router.get("/", (req, res) => nearbyPlaceController.getNearby(req, res));

/**
 * @swagger
 * /api/nearby-places/photo:
 *   get:
 *     tags:
 *       - Nearby Places
 *     summary: Proxy a Google Places photo
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to the photo
 *       400:
 *         description: Invalid photo name
 */
router.get("/photo", (req, res) => nearbyPlaceController.getPhoto(req, res));

/**
 * @swagger
 * /api/nearby-places/station/{stationId}:
 *   get:
 *     tags:
 *       - Nearby Places
 *     summary: Find restaurants and stores near a charging station
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
 *       404:
 *         description: Charging station not found
 */
router.get("/station/:stationId", (req, res) =>
  nearbyPlaceController.getNearbyForStation(req, res)
);

export default router;
