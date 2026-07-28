import { Router } from "express";
import AchievementController from "../controllers/achievement-controller";
import achievementService from "../services/achievement-service"; 
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const controller = new AchievementController(achievementService);

/**
 * @swagger
 * /api/achievements/me:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: Get authenticated user's unlocked achievements
 *     description: Returns all achievements the user has earned
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved unlocked achievements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 count:
 *                   type: integer
 *                   description: Number of achievements returned
 *                   example: 18
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       achievementId:
 *                         type: string
 *                       unlockedAt:
 *                         type: string
 *                         format: date-time
 *                       pointsAwarded:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/me", authGuard(["user", "admin"]), (req, res) =>
    controller.getMyAchievements(req, res)
);

/**
 * @swagger
 * /api/achievements/all:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: Get all achievements in the system
 *     description: Returns the full list of achievements (unlocked + locked) for display purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 count:
 *                   type: integer
 *                   description: Number of achievements returned
 *                   example: 18
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       category:
 *                         type: string
 *                       rarity:
 *                         type: string
 *                       points:
 *                         type: number
 *                       milestone:
 *                         type: object
 *                       unlocked:
 *                         type: boolean
 *                       unlockedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/all", authGuard(["user", "admin"]), (req, res) =>
    controller.getAllAchievements(req, res)
);

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: Get all achievements with user progress
 *     description: Returns every achievement in the system and whether the current user has unlocked it
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 count:
 *                   type: integer
 *                   description: Number of achievements returned
 *                   example: 18
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       category:
 *                         type: string
 *                       rarity:
 *                         type: string
 *                       points:
 *                         type: number
 *                       milestone:
 *                         type: object
 *                       unlocked:
 *                         type: boolean
 *                       unlockedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get("/", authGuard(["user", "admin"]), (req, res) =>
    controller.getAchievementsWithProgress(req, res)
);

/**
 * @swagger
 * /api/achievements/me-recent:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: Get 6 most recently unlocked achievements
 *     description: Returns the user's most recent achievements (great for "Recent Activity" or notification feed)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 count:
 *                   type: integer
 *                   description: Number of achievements returned
 *                   example: 18
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       achievementId:
 *                         type: string
 *                       unlockedAt:
 *                         type: string
 *                         format: date-time
 *                       pointsAwarded:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/me-recent", authGuard(["user", "admin"]), (req, res) =>
    controller.getRecentAchievements(req, res)
);

export default router;