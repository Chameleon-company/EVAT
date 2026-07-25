import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";
import VehicleController from "../controllers/vehicle-controller";
import VehicleService from "../services/vehicle-service";

const router = Router();
const vehicleService = new VehicleService();
const vehicleController = new VehicleController(vehicleService);

// const profileController = new VehicleController(vehicleService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         make:
 *           type: string
 *         model:
 *           type: string
 *         year:
 *           type: number
 *         registrationNumber:
 *           type: string
 *         favouriteStations:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/vehicle/{vehicleId}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get vehicle by ID
 *     description: Retrieve a vehicle's details by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID
 *     responses:
 *       200:
 *         description: Successfully retrieved vehicle details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.get("/:vehicleId", authGuard(["user", "admin"]), (req, res) =>
  vehicleController.getVehicleById(req, res)
);

/**
 * @swagger
 * /api/vehicle:
 *   get:
 *     tags:
 *       - User
 *     summary: Get all vehicles
 *     description: Retrieve a list of all vehicles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved vehicles list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", authGuard(["user", "admin"]), (req, res) =>
  vehicleController.getAllVehicles(req, res)
);

export default router;
