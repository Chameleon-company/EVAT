import { Router } from "express";
import FeedbackController from "../controllers/feedback-controller";
import FeedbackService from "../services/feedback-service";
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const feedbackService = new FeedbackService();
const feedbackController = new FeedbackController(feedbackService);

/**
 * @swagger
 * components:
 *   schemas:
 *     FeedbackResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         suggestion:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     tags:
 *       - Feedback
 *     summary: Submit feedback
 *     description: Submit a new feedback form
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - suggestion
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 maxLength: 255
 *               suggestion:
 *                 type: string
 *                 example: "The app is great but could use more charging stations in the city center."
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedback submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/FeedbackResponse'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/", (req, res) => feedbackController.submitFeedback(req, res));

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get all feedbacks (Admin only)
 *     description: Retrieve all feedbacks with pagination and optional status filtering
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
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Feedbacks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedbacks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     feedbacks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeedbackResponse'
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
 *       500:
 *         description: Server error
 */
router.get("/", authGuard(["admin"]), (req, res) => feedbackController.getAllFeedbacks(req, res));

/**
 * @swagger
 * /api/feedback/statistics:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback statistics (Admin only)
 *     description: Get statistics about feedback submissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedback statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                     reviewed:
 *                       type: integer
 *                     resolved:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/statistics", authGuard(["admin"]), (req, res) => feedbackController.getFeedbackStatistics(req, res));

/**
 * @swagger
 * /api/feedback/email:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedbacks by email (Admin only)
 *     description: Retrieve all feedbacks submitted by a specific email address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to search for
 *     responses:
 *       200:
 *         description: Feedbacks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedbacks retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeedbackResponse'
 *       400:
 *         description: Email parameter is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/email", authGuard(["admin"]), (req, res) => feedbackController.getFeedbacksByEmail(req, res));

/**
 * @swagger
 * /api/feedback/{id}:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback by ID (Admin only)
 *     description: Retrieve a specific feedback by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedback retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/FeedbackResponse'
 *       404:
 *         description: Feedback not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:id", authGuard(["admin"]), (req, res) => feedbackController.getFeedbackById(req, res));

/**
 * @swagger
 * /api/feedback/{id}/status:
 *   put:
 *     tags:
 *       - Feedback
 *     summary: Update feedback status (Admin only)
 *     description: Update the status of a specific feedback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved]
 *                 example: "reviewed"
 *     responses:
 *       200:
 *         description: Feedback status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedback status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/FeedbackResponse'
 *       400:
 *         description: Bad request - invalid status or missing status
 *       404:
 *         description: Feedback not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put("/:id/status", authGuard(["admin"]), (req, res) => feedbackController.updateFeedbackStatus(req, res));

/**
 * @swagger
 * /api/feedback/{id}:
 *   delete:
 *     tags:
 *       - Feedback
 *     summary: Delete feedback (Admin only)
 *     description: Delete a specific feedback by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedback deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/FeedbackResponse'
 *       404:
 *         description: Feedback not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/:id", authGuard(["admin"]), (req, res) => feedbackController.deleteFeedback(req, res));

export default router;
