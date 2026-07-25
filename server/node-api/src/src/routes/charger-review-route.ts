import { Router } from "express";
import ChargerReviewController from "../controllers/charger-review-controller";
import ChargerReviewService from "../services/charger-review-service";
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const chargerReviewService = new ChargerReviewService();
const chargerReviewController = new ChargerReviewController(chargerReviewService);

/**
 * @swagger
 * components:
 *   schemas:
 *     ChargerReviewResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         chargerId:
 *           type: string
 *         userId:
 *           type: string
 *         userName:
 *           type: string
 *         userAvatar:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         timeAgo:
 *           type: string
 *           example: "2 days ago"
 *     
 *     ChargerRatingStatsResponse:
 *       type: object
 *       properties:
 *         averageRating:
 *           type: number
 *           example: 4.3
 *         totalReviews:
 *           type: integer
 *           example: 12
 *         ratingDistribution:
 *           type: object
 *           properties:
 *             "1":
 *               type: integer
 *             "2":
 *               type: integer
 *             "3":
 *               type: integer
 *             "4":
 *               type: integer
 *             "5":
 *               type: integer
 *         starRating:
 *           type: string
 *           example: "★★★★☆"
 */

/**
 * @swagger
 * /api/charger-reviews:
 *   post:
 *     tags:
 *       - Charger Reviews
 *     summary: Submit a new review for a charger
 *     description: Submit a new review for a specific charger. Users can only submit one review per charger.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chargerId
 *               - rating
 *               - comment
 *             properties:
 *               chargerId:
 *                 type: string
 *                 example: "charger_123"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Great charging station! Fast charging and clean facilities."
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ChargerReviewResponse'
 *       400:
 *         description: Bad request - validation error or user already reviewed this charger
 *       401:
 *         description: Unauthorized - authentication required
 */
router.post("/", authGuard(["user", "admin"]), (req, res) => chargerReviewController.submitReview(req, res));

/**
 * @swagger
 * /api/charger-reviews/{id}:
 *   put:
 *     tags:
 *       - Charger Reviews
 *     summary: Update an existing review
 *     description: Update your own review for a charger. Only the review owner can update their review.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated: Excellent charging station with great amenities!"
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ChargerReviewResponse'
 *       400:
 *         description: Bad request - validation error or unauthorized
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.put("/:id", authGuard(["user", "admin"]), (req, res) => chargerReviewController.updateReview(req, res));

/**
 * @swagger
 * /api/charger-reviews/{id}:
 *   delete:
 *     tags:
 *       - Charger Reviews
 *     summary: Delete a review
 *     description: Delete your own review. Only the review owner can delete their review.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ChargerReviewResponse'
 *       400:
 *         description: Bad request - unauthorized
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.delete("/:id", authGuard(["user", "admin"]), (req, res) => chargerReviewController.deleteReview(req, res));

/**
 * @swagger
 * /api/charger-reviews/charger/{chargerId}:
 *   get:
 *     tags:
 *       - Charger Reviews
 *     summary: Get reviews for a specific charger
 *     description: Retrieve all reviews for a specific charger with pagination support.
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Charger ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Charger reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charger reviews retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChargerReviewResponse'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       500:
 *         description: Server error
 */
router.get("/charger/:chargerId", (req, res) => chargerReviewController.getChargerReviews(req, res));

/**
 * @swagger
 * /api/charger-reviews/user/{userId}:
 *   get:
 *     tags:
 *       - Charger Reviews
 *     summary: Get reviews by a specific user
 *     description: Retrieve all reviews submitted by a specific user with pagination support.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User reviews retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChargerReviewResponse'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       500:
 *         description: Server error
 */
router.get("/user/:userId", (req, res) => chargerReviewController.getUserReviews(req, res));

/**
 * @swagger
 * /api/charger-reviews/charger/{chargerId}/stats:
 *   get:
 *     tags:
 *       - Charger Reviews
 *     summary: Get rating statistics for a charger
 *     description: Get comprehensive rating statistics for a specific charger including average rating, total reviews, and rating distribution.
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Charger ID
 *     responses:
 *       200:
 *         description: Charger rating statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charger rating statistics retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ChargerRatingStatsResponse'
 *       500:
 *         description: Server error
 */
router.get("/charger/:chargerId/stats", (req, res) => chargerReviewController.getChargerRatingStats(req, res));

/**
 * @swagger
 * /api/charger-reviews/stats/multiple:
 *   post:
 *     tags:
 *       - Charger Reviews
 *     summary: Get rating statistics for multiple chargers
 *     description: Get rating statistics for multiple chargers in a single request for efficient data loading.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chargerIds
 *             properties:
 *               chargerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["charger_123", "charger_456", "charger_789"]
 *     responses:
 *       200:
 *         description: Multiple charger rating statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Multiple charger rating statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/ChargerRatingStatsResponse'
 *       400:
 *         description: Bad request - chargerIds array is required
 *       500:
 *         description: Server error
 */
router.post("/stats/multiple", (req, res) => chargerReviewController.getMultipleChargerRatingStats(req, res));

/**
 * @swagger
 * /api/charger-reviews/charger/{chargerId}/user-status:
 *   get:
 *     tags:
 *       - Charger Reviews
 *     summary: Check if user has reviewed a charger
 *     description: Check if the authenticated user has already reviewed a specific charger and get their review if it exists.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Charger ID
 *     responses:
 *       200:
 *         description: User review status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User review status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasReviewed:
 *                       type: boolean
 *                       example: true
 *                     userReview:
 *                       $ref: '#/components/schemas/ChargerReviewResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/charger/:chargerId/user-status", authGuard(["user", "admin"]), (req, res) => chargerReviewController.checkUserReviewStatus(req, res));

/**
 * @swagger
 * /api/charger-reviews/admin/all:
 *   get:
 *     tags:
 *       - Charger Reviews (Admin)
 *     summary: Get all reviews with filtering (Admin only)
 *     description: Retrieve all reviews with optional filtering by charger, user, or minimum rating. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of reviews per page
 *       - in: query
 *         name: chargerId
 *         schema:
 *           type: string
 *         description: Filter by charger ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by minimum rating
 *     responses:
 *       200:
 *         description: All reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All reviews retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChargerReviewResponse'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get("/admin/all", authGuard(["admin"]), (req, res) => chargerReviewController.getAllReviews(req, res));

export default router;
