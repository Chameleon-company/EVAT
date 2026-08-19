"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth-middleware");
const ice_vehicle_controller_1 = __importDefault(require("../controllers/ice-vehicle-controller"));
const ice_vehicle_service_1 = __importDefault(require("../services/ice-vehicle-service"));
const router = (0, express_1.Router)();
const iceVehicleService = new ice_vehicle_service_1.default();
const iceVehicleController = new ice_vehicle_controller_1.default(iceVehicleService);
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
 * /api/ice-vehicle/{vehicleId}:
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
router.get("/:vehicleId", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => iceVehicleController.getVehicleById(req, res));
/**
 * @swagger
 * /api/ice-vehicle:
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
router.get("/", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => iceVehicleController.getAllVehicles(req, res));
exports.default = router;
