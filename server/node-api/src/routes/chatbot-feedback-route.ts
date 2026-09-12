import { Router } from "express";
import ChatbotFeedbackController from "../controllers/chatbot-feedback-controller";
import ChatbotFeedbackService from "../services/chatbot-feedback-service";
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const chatbotFeedbackService = new ChatbotFeedbackService();
const chatbotFeedbackController = new ChatbotFeedbackController(chatbotFeedbackService);

/**
 * @swagger
 * /api/chatbot-feedback:
 *   put:
 *     tags:
 *       - Chatbot Feedback
 *     summary: Rate a chatbot reply
 *     description: >
 *       Save, change or clear the signed-in user's thumbs up/down on one chatbot reply.
 *       Each user has at most one rating per reply; send rating null to clear it.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *               - rating
 *             properties:
 *               messageId:
 *                 type: string
 *                 maxLength: 100
 *                 example: "1757656842113.42"
 *               rating:
 *                 type: string
 *                 nullable: true
 *                 enum: [up, down]
 *                 example: "down"
 *               tab:
 *                 type: string
 *                 enum: [station, ai]
 *                 description: Required unless rating is null
 *                 example: "ai"
 *               reply:
 *                 type: string
 *                 description: The rated reply (required unless rating is null, cut to 4000 characters)
 *                 example: "Most EVs in Australia charge at 7 kW at home..."
 *               question:
 *                 type: string
 *                 description: The user's question that led to the reply (cut to 1000 characters)
 *                 example: "How long does an EV take to charge at home?"
 *     responses:
 *       200:
 *         description: Rating saved or cleared
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put("/", authGuard(["user", "admin"]), (req, res) => chatbotFeedbackController.rateReply(req, res));

/**
 * @swagger
 * /api/chatbot-feedback/summary:
 *   get:
 *     tags:
 *       - Chatbot Feedback
 *     summary: Summarise chatbot ratings (Admin only)
 *     description: Thumbs up/down totals, split by Station Assistant and EVAT-AI, plus the ten most recent thumbs-down replies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an admin
 *       500:
 *         description: Server error
 */
router.get("/summary", authGuard(["admin"]), (req, res) => chatbotFeedbackController.getSummary(req, res));

export default router;
