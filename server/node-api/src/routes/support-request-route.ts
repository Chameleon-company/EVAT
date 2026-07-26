import { Router } from "express";
import { createSupportRequest, listMySupportRequests } from "../controllers/support-request-controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Support Requests
 *   description: Create and view support requests
 */

/**
 * @swagger
 * /api/support-requests:
 *   post:
 *     summary: Create a support request
 *     tags: [Support Requests]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema: { type: string }
 *         description: User ID of the logged-in user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [issue, description]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               issue: { type: string, enum: [station, payment, info, other] }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", createSupportRequest);

/**
 * @swagger
 * /api/support-requests/me:
 *   get:
 *     summary: List my support requests
 *     tags: [Support Requests]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/me", listMySupportRequests);

export default router;