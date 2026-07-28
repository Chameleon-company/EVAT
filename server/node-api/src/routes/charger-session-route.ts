//Express routes

import express from 'express';
import { Request, Response } from 'express';

import ChargerSessionController from '../controllers/charger-session-controller';
import ChargerSessionService from '../services/charger-session-service';
import userStatsService from "../services/user-stats-service";
import ChargerSessionRepository from '../repositories/charger-session-repository';

// Middleware
import { authGuard } from '../middlewares/auth-middleware';

// Initialise router
const router = express.Router();

// Setup: controller -> service -> repository
const chargerSessionRepository = new ChargerSessionRepository();
const chargerSessionService = new ChargerSessionService(chargerSessionRepository);
const chargerSessionController = new ChargerSessionController(chargerSessionService, userStatsService);

// Routes with Swagger documentations

/**
 * @swagger
 * /api/charger-sessions/{sessionId}:
 *   get:
 *     summary: Get a charging session by ID
 *     description: Get a specific charging session using its session ID.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charging session
 *         example: "123"
 *     responses:
 *       200:
 *         description: Charging session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success! Session ID 123 found."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "123"
 *                     userId:
 *                       type: string
 *                       example: "456"
 *                     stationId:
 *                       type: string
 *                       example: "789"
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-07T04:00:00Z"
 *                     status:
 *                       type: string
 *                       example: "in_progress"
 *       404:
 *         description: Charging session with the provided ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session with ID 123 not found."
 */
router.get('/:sessionId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.getSessionById(req, res));

/**
 * @swagger
 * /api/charger-sessions/user/{userId}:
 *   get:
 *     summary: Get all sessions for a specific user ID
 *     description: Retrieves all charging sessions of a user based on their ID.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *         example: "456"
 *     responses:
 *       200:
 *         description: Charging sessions for the user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User ID 456 sessions found."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "123"
 *                       userId:
 *                         type: string
 *                         example: "456"
 *                       stationId:
 *                         type: string
 *                         example: "789"
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-07T04:00:00Z"
 *                       status:
 *                         type: string
 *                         example: "in_progress"
 *       404:
 *         description: User with the provided ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User ID 123 not found."
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.getSessionsByUser(req, res));

/**
 * @swagger
 * /api/charger-sessions/station/{stationId}:
 *   get:
 *     summary: Get all sessions for a specific station ID
 *     description: Retrieves all charging sessions that occurred at a the specified charging station.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charging station
 *         example: "789"
 *     responses:
 *       200:
 *         description: Charging sessions for the station retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station sessions ID 789 found."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "123"
 *                       userId:
 *                         type: string
 *                         example: "456"
 *                       stationId:
 *                         type: string
 *                         example: "789"
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-07T04:00:00Z"
 *                       status:
 *                         type: string
 *                         example: "in_progress"
 *       404:
 *         description: Station with the provided ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station ID 789 not found."
 *       500:
 *         description: Server error
 */
router.get('/station/:stationId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.getSessionsByStation(req, res));

/**
 * @swagger
 * /api/charger-sessions/:
 *   post:
 *     summary: Start a new charging session
 *     description: Start a new charging session for a user at a charging station.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - stationId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "456"
 *               stationId:
 *                 type: string
 *                 example: "789"
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-07T04:00:00Z"
 *     responses:
 *       201:
 *         description: Charging session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charging session ID 123 started."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "123"
 *                     userId:
 *                       type: string
 *                       example: "456"
 *                     stationId:
 *                       type: string
 *                       example: "789"
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-07T04:00:00Z"
 *                     status:
 *                       type: string
 *                       example: "in_progress"
 *       500:
 *         description: Server error
 */
router.post('/', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.createSession(req, res));

/**
 * @swagger
 * /api/charger-sessions/end/{sessionId}:
 *   patch:
 *     summary: End a charging session by session ID
 *     description: Ends a charging session by marking its completion time and update it status.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charging session to end
 *         example: "789"
 *     responses:
 *       200:
 *         description: Charging session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charging session ID 789 ended."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "123"
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-07T04:00:00Z"
 *       404:
 *         description: Charging session with the provided ID not found or doesn't exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session with ID 789 not found."
 */
router.patch('/end/:sessionId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.endSession(req, res));

/**
 * @swagger
 * /api/charger-sessions/sessions/stream:
 *   get:
 *     summary: Server-Sent Events (SSE) for the charger session
 *     description: Opens a SSE connection to stream real-time updates of charging session events (insert, update, delete).
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time stream of charger session events.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: {\"sessionId\":\"123\",\"userId\":\"456\",\"status\":\"in_progress\",\"timestamp\":\"2025-09-01T12:00:00.000Z\",\"operationType\":\"insert\"}\n\n"
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions/stream', authGuard(['admin']), (req: Request, res: Response) => chargerSessionController.streamSessions(req, res));

/**
 * @swagger
 * /api/charger-sessions/sessions/logs:
 *   get:
 *     summary: Retrieve historical charger session logs
 *     description: Fetches historical charger session events (insert, update, delete).  
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of log entries to return.
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of log entries to skip (for pagination).
 *     responses:
 *       200:
 *         description: Historical session logs retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sessionId:
 *                     type: string
 *                     example: 123
 *                   userId:
 *                     type: string
 *                     example: 456
 *                   stationId:
 *                     type: string
 *                     example: 789
 *                   status:
 *                     type: string
 *                     example: "in_progress"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-07T04:00:00Z"
 *                   operationType:
 *                     type: string
 *                     example: "insert"
 *                   energyDelivered:
 *                     type: number
 *                     example: "10.0"
 *                   cost:
 *                     type: number
 *                     example: "4.00"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch logs
 */
router.get('/sessions/logs', authGuard(['admin']), (req: Request, res: Response) => chargerSessionController.getLogs(req, res));

export default router;