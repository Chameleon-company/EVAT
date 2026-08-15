import { Router } from "express";
import PromotionController from "../controllers/promotion-controller";
import PromotionService from "../services/promotion-service";
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const promotionService = new PromotionService();
const promotionController = new PromotionController(promotionService);

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *           example: Charge & Sip
 *         description:
 *           type: string
 *         businessName:
 *           type: string
 *           example: Little Collins Roast
 *         category:
 *           type: string
 *           enum: [coffee, food, shopping, entertainment, services]
 *         discountLabel:
 *           type: string
 *           example: 20% off drinks
 *         promoCode:
 *           type: string
 *           example: EVAT20
 *         address:
 *           type: string
 *         websiteUrl:
 *           type: string
 *         terms:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         stationIds:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         startsAt:
 *           type: string
 *           format: date-time
 *         endsAt:
 *           type: string
 *           format: date-time
 *         distanceMeters:
 *           type: number
 *           example: 180
 *         walkingMinutes:
 *           type: number
 *           example: 2
 *         isFallback:
 *           type: boolean
 */

/**
 * @swagger
 * /api/promotions/nearby:
 *   get:
 *     tags:
 *       - Promotions
 *     summary: Get promotions near a location
 *     description: Returns active partner offers within walking distance of the given coordinates.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the charging station or user
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the charging station or user
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 0.8
 *         description: Search radius in kilometres (max 5)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [coffee, food, shopping, entertainment, services]
 *       - in: query
 *         name: stationId
 *         schema:
 *           type: string
 *         description: Also include promotions linked to this station
 *       - in: query
 *         name: includeFallbacks
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Nearby promotions retrieved successfully
 *       400:
 *         description: Invalid coordinates or filters
 */
router.get("/nearby", (req, res) => promotionController.getNearby(req, res));

/**
 * @swagger
 * /api/promotions/station/{stationId}:
 *   get:
 *     tags:
 *       - Promotions
 *     summary: Get promotions near a charging station
 *     description: Looks up the station location and returns offers within walking distance.
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
 *           default: 0.8
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [coffee, food, shopping, entertainment, services]
 *       - in: query
 *         name: includeFallbacks
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Nearby promotions retrieved successfully
 *       404:
 *         description: Charging station not found
 */
router.get("/station/:stationId", (req, res) =>
  promotionController.getNearbyForStation(req, res)
);

/**
 * @swagger
 * /api/promotions/seed:
 *   post:
 *     tags:
 *       - Promotions (Admin)
 *     summary: Seed sample promotions
 *     description: Inserts Melbourne and Perth sample offers if the collection is empty.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Sample promotions seeded
 *       200:
 *         description: Sample promotions already exist
 */
router.post("/seed", authGuard(["admin"]), (req, res) =>
  promotionController.seedPromotions(req, res)
);

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     tags:
 *       - Promotions (Admin)
 *     summary: List all promotions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Promotions retrieved successfully
 *   post:
 *     tags:
 *       - Promotions (Admin)
 *     summary: Create a promotion
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - businessName
 *               - category
 *               - discountLabel
 *               - latitude
 *               - longitude
 *             properties:
 *               title:
 *                 type: string
 *               businessName:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [coffee, food, shopping, entertainment, services]
 *               discountLabel:
 *                 type: string
 *               description:
 *                 type: string
 *               promoCode:
 *                 type: string
 *               address:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               terms:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               stationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               endsAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Promotion created successfully
 *       400:
 *         description: Validation error
 */
router.get("/", authGuard(["admin"]), (req, res) =>
  promotionController.getAllPromotions(req, res)
);
router.post("/", authGuard(["admin"]), (req, res) =>
  promotionController.createPromotion(req, res)
);

/**
 * @swagger
 * /api/promotions/{id}:
 *   get:
 *     tags:
 *       - Promotions
 *     summary: Get a promotion by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promotion retrieved successfully
 *       404:
 *         description: Promotion not found
 *   put:
 *     tags:
 *       - Promotions (Admin)
 *     summary: Update a promotion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Promotion updated successfully
 *       404:
 *         description: Promotion not found
 *   delete:
 *     tags:
 *       - Promotions (Admin)
 *     summary: Delete a promotion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promotion deleted successfully
 *       404:
 *         description: Promotion not found
 */
router.get("/:id", (req, res) => promotionController.getPromotionById(req, res));
router.put("/:id", authGuard(["admin"]), (req, res) =>
  promotionController.updatePromotion(req, res)
);
router.delete("/:id", authGuard(["admin"]), (req, res) =>
  promotionController.deletePromotion(req, res)
);

export default router;
