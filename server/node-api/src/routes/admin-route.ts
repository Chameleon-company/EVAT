import express from 'express';
import { isAdminAuthenticated } from '../middlewares/is-admin-auth';
import {
  listUsers,
  deleteUser,
  updateUser,
  getLogs,
  getInsights,
  listStations,
  updateStation,
  deleteStation,
  addStation
} from '../controllers/admin-controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin control panel features
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get('/users', isAdminAuthenticated, listUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', isAdminAuthenticated, deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/users/:id', isAdminAuthenticated, updateUser);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get admin logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs data
 */
router.get('/logs', isAdminAuthenticated, getLogs);

/**
 * @swagger
 * /api/admin/insights:
 *   get:
 *     summary: Get data insights
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights data
 */
router.get('/insights', isAdminAuthenticated, getInsights);

/**
 * @swagger
 * /api/admin/stations:
 *   get:
 *     summary: Get all charging stations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of charging stations
 */
router.get('/stations', isAdminAuthenticated, listStations);

/**
 * @swagger
 * /api/admin/stations/{id}:
 *   put:
 *     summary: Update a charging station
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Station updated
 */
router.put('/stations/:id', isAdminAuthenticated, updateStation);

/**
 * @swagger
 * /api/admin/stations/{id}:
 *   delete:
 *     summary: Delete a charging station
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station deleted
 */

router.delete('/stations/:id', isAdminAuthenticated, deleteStation);
/**
 * @swagger
 * /api/admin/stations:
 *   post:
 *     summary: Add a new charging station
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operator
 *               - connection_type
 *               - current_type
 *               - location
 *             properties:
 *               operator:
 *                 type: string
 *                 example: "Chargefox"
 *               connection_type:
 *                 type: string
 *                 example: "CCS (Type 2)"
 *               current_type:
 *                 type: string
 *                 example: "DC"
 *               location:
 *                 type: object
 *                 required:
 *                   - type
 *                   - coordinates
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: "Point"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     example: [147.327774, -38.005127]
 *     responses:
 *       201:
 *         description: Station added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charging station added"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "682f0ba562208db1d97ff8c5"
 *                     operator:
 *                       type: string
 *                     connection_type:
 *                       type: string
 *                     current_type:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 */

router.post('/stations', isAdminAuthenticated, addStation);


export default router;
