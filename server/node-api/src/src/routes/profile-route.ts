import { Router } from "express";
import UserService from "../services/user-service";
import { authGuard } from "../middlewares/auth-middleware";
import ProfileService from "../services/profile-service";
import ProfileController from "../controllers/profile-controller";
import VehicleService from "../services/vehicle-service";
import ChargingStationService from "../services/station-service";

const router = Router();
const userService = new UserService();
const profileService = new ProfileService();
const vehicleService = new VehicleService();
const stationService = new ChargingStationService();
const profileController = new ProfileController(
  userService,
  profileService,
  vehicleService,
  stationService
);

/**
 * @swagger
 * components:
 *   schemas:
 *     VehicleModel:
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
 *     ChargingStation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               example: [145.1679215, -37.9420423]
 *         cost:
 *           type: string
 *         charging_points:
 *           type: number
 *         pay_at_location:
 *           type: string
 *         membership_required:
 *           type: string
 *         access_key_required:
 *           type: string
 *         is_operational:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         operator:
 *           type: string
 *         connection_type:
 *           type: string
 *         current_type:
 *           type: string
 *         charging_points_flag:
 *           type: number
 *     UserProfile:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         user_car_model:
 *           $ref: '#/components/schemas/VehicleModel'
 *         favourite_stations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChargingStation'
 */

/**
 * @swagger
 * /api/profile/user-profile:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user profile details including car model & favourite charging stations
 *     description: Retrieve the complete profile of the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get("/user-profile", authGuard(["user", "admin"]), (req, res) =>
  profileController.getUserProfile(req, res)
);

/**
 * @swagger
 * /api/profile/vehicle-model:
 *   post:
 *     tags:
 *       - User
 *     summary: Update user's vehicle model
 *     description: Update the vehicle model associated with the user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "66d7e0f5cdf87e8b5d63de70"
 *     responses:
 *       201:
 *         description: Vehicle model updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Update user vehicle model successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle or user not found
 */
router.post("/vehicle-model", authGuard(["user", "admin"]), (req, res) =>
  profileController.updateUserVehicleModel(req, res)
);

/**
 * @swagger
 * /api/profile/add-favourite-station:
 *   post:
 *     tags:
 *       - User
 *     summary: Add a favourite charging station
 *     description: Add a charging station to user's favourite stations list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stationId:
 *                 type: string
 *                 example: "66d7e0a1cdf87e8b5d63d80b"
 *     responses:
 *       201:
 *         description: Station added to favourites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Add favourite station successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Station or user not found
 */
router.post(
  "/add-favourite-station",
  authGuard(["user", "admin"]),
  (req, res) => profileController.addFavouriteStation(req, res)
);

/**
 * @swagger
 * /api/profile/remove-favourite-station:
 *   post:
 *     tags:
 *       - User
 *     summary: Remove a favourite charging station
 *     description: Remove a charging station from user's favourite stations list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stationId:
 *                 type: string
 *                 example: "66d7e0a1cdf87e8b5d63d80b"
 *     responses:
 *       201:
 *         description: Station removed from favourites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Remove favourite station successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  "/remove-favourite-station",
  authGuard(["user", "admin"]),
  (req, res) => profileController.deleteFavouriteStation(req, res)
);

export default router;
