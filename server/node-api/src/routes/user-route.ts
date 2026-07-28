import { Router } from "express";
import UserController from "../controllers/user-controller";
import UserService from "../services/user-service";
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserItemResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         mobile:
 *           type: string
 *         role:
 *           type: string
 */

/**
 * @swagger
 * security:
 *   - bearerAuth: []
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Milly"
 *               lastName:
 *                 type: string
 *                 example: "Brown"
 *               email:
 *                 type: string
 *                 example: "example@deakin.edu.au"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               mobile:
 *                 type: string
 *                 example: "0412345678"
 *                 description: "Australian mobile number starting with 04"           
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/register", (req, res) => userController.register(req, res));

// Swagger for jwt login may have to be redone to properly allow the testing bit to work(?)

/**
 * @swagger
 * /api/auth/jwt-login:
 *   post:
 *     summary: Automatic login with Access & Refresh Tokens
 *     description: >
 *       This endpoint attempts to log the user in automatically using their tokens.  
 * 
 *       - If the access token is still valid, the user is logged in directly.  
 *       - If the access token is expired but the refresh token is still valid, a new access token is issued and the user is logged in.  
 *       - If both tokens are expired or invalid, the user must log in again.  
 *       
 *       In all successful cases, the user's `lastLogin` timestamp is updated.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: Bearer access token in the format `Bearer {token}`
 *         required: true
 *         schema:
 *           type: string
 *           example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Automatic login successful (either access token still valid, or new one issued)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Automatic Login Successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: User object
 *                     accessToken:
 *                       type: string
 *                       description: New access token (if one was issued)
 *                       example: "eyJhbGciOiJIUzI1NiIs..."
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token, unchanged
 *                       example: "eyJhbGciOiJIUzI1NiIs..."
 *       401:
 *         description: Missing, invalid, or expired refresh token (login required)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Refresh token expired, please log in again"
 *       404:
 *         description: User not found or refresh token missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 */
router.post("/jwt-login", (req, res) => userController.jwtLogin(req, res));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login
 *     description: Log in by providing email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "example@deakin.edu.au"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/login", (req, res) => userController.login(req, res));

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh Access Token
 *     description: Get a new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *     responses:
 *       200:
 *         description: Successfully refreshed token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/refresh-token", (req, res) =>
  userController.refreshToken(req, res)
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user profile including id, firstName, lastName, email, mobile, role
 *     description: Get the profile of the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
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
 *                   $ref: '#/components/schemas/UserItemResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile", authGuard(["user", "admin"]), (req, res) =>
  userController.getUserById(req, res)
);
router.put("/profile", authGuard(["user","admin"]), (req, res) =>
  userController.updateUserProfile(req, res)
);

/**
 * @swagger
 * /api/auth/payment:
 *   put:
 *     tags:
 *       - User
 *     summary: Add or update payment information
 *     description: Allows the authenticated user to add or update their payment details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardNumber:
 *                 type: string
 *                 example: "4111111111111111"
 *               expiryDate:
 *                 type: string
 *                 example: "12/26"
 *               cvv:
 *                 type: string
 *                 example: "123"
 *               billingAddress:
 *                 type: string
 *                 example: "123 Main St, Melbourne, VIC"
 *     responses:
 *       200:
 *         description: Successfully updated payment information
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// router.put("/payment", authGuard(["user", "admin"]), (req, res) =>
//   userController.updatePaymentInfo(req, res)
// );

/**
 * @swagger
 * /api/auth/user-list:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users
 *     description: Get a list of all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user list
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
 *                     $ref: '#/components/schemas/UserItemResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/user-list", authGuard(["admin"]), (req, res) =>
  userController.getAllUser(req, res)
);

export default router;
