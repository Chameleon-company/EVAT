import { Router } from "express";
import UserService from "../services/user-service";
import { authGuard } from "../middlewares/auth-middleware";
import ProfileService from "../services/profile-service";
import ProfileController from "../controllers/profile-controller";
import VehicleService from "../services/vehicle-service";
import ChargingStationService from "../services/station-service";
import { UserStatsService }  from "../services/user-stats-service";
import predictController from "../controllers/predict-controller";

const router = Router();
const userService = new UserService();
const profileService = new ProfileService();
const vehicleService = new VehicleService();
const stationService = new ChargingStationService();
const userStatsService = new UserStatsService();
const profileController = new ProfileController(
  userService,
  profileService,
  vehicleService,
  stationService,
  userStatsService
);

/**
 * @swagger
 * components:
 *     schemas:
 *         VehicleModel:
 *             type: object
 *             properties:
 *                 id:
 *                     type: string
 *                 make:
 *                     type: string
 *                 model:
 *                     type: string
 *                 year:
 *                     type: number
 *         ChargingStation:
 *             type: object
 *             properties:
 *                 _id:
 *                     type: string
 *                 location:
 *                     type: object
 *                     properties:
 *                         type:
 *                             type: string
 *                             example: Point
 *                         coordinates:
 *                             type: array
 *                             items:
 *                                 type: number
 *                             example:
 *                                 - 145.1679215
 *                                 - -37.9420423
 *                 cost:
 *                     type: string
 *                 charging_points:
 *                     type: number
 *                 pay_at_location:
 *                     type: string
 *                 membership_required:
 *                     type: string
 *                 access_key_required:
 *                     type: string
 *                 is_operational:
 *                     type: string
 *                 latitude:
 *                     type: number
 *                 longitude:
 *                     type: number
 *                 operator:
 *                     type: string
 *                 connection_type:
 *                     type: string
 *                 current_type:
 *                     type: string
 *                 charging_points_flag:
 *                     type: number
 *         UserProfile:
 *             type: object
 *             properties:
 *                 userId:
 *                     type: string
 *                 user_car_model:
 *                     $ref: '#/components/schemas/VehicleModel'
 *                 favourite_stations:
 *                     type: array
 *                     items:
 *                         $ref: '#/components/schemas/ChargingStation'
 *         Username:
 *             type: object
 *             properties:
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
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

/**
 * @swagger
 * /api/profile/username/{userID}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get a username by ID
 *     description: Retrieve a provided user ID's first and last name for review lookup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user's name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Username'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/username/:userID",
  authGuard(["user", "admin"]),
  (req, res) => profileController.getUsernameByID(req, res)
);

/**
 * @swagger
 * /api/profile/avatar:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user's profile avatar
 *     description: Retrieve the avatarURL of the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved avatar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarURL:
 *                       type: string
 *                       example: "defaultProfilePictures/default-blue.png"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User profile not found
 *       500:
 *         description: Server error
 */
router.get("/avatar",
  authGuard(["user", "admin"]),
  (req, res) => profileController.getUserAvatar(req, res)
);

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     tags:
 *       - User
 *     summary: Update user's profile avatar
 *     description: Change the avatarURL of the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarURL:
 *                 type: string
 *                 example: "https://example.com/new-avatar.png"
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Avatar updated successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User profile not found
 *       500:
 *         description: Server error
 */
router.post("/avatar", 
  authGuard(["user", "admin"]), 
  (req, res) => profileController.updateAvatar(req, res)
);

export default router;
