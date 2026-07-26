import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";
import GamificationController from "../controllers/gamification-controller";

const router = Router();
const gamificationController = new GamificationController();

/**
 * @swagger
 * tags:
 *   - name: Gamification
 *     description: Endpoints for the EVAT gamification system
 * components:
 *   schemas:
 *     GameProfile:
 *       type: object
 *       properties:
 *         main_app_user_id:
 *           type: string
 *         gamification_profile:
 *           type: object
 *     GameBadge:
 *       type: object
 *       properties:
 *         badge_id_string:
 *           type: string
 *     GameVirtualItem:
 *       type: object
 *       properties:
 *         item_id_string:
 *           type: string
 *     GameQuest:
 *       type: object
 *       properties:
 *         quest_id_string:
 *           type: string
 *     GameEvent:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *         session_id:
 *           type: string
 *         event_type:
 *           type: string
 *         action_type:
 *           type: string
 *         details:
 *           type: object
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid.
 *     NotFoundError:
 *       description: The requested resource was not found.
 *     BadRequestError:
 *       description: The request was malformed or had invalid data.
 *     ServerError:
 *       description: An unexpected error occurred on the server.
 */


// ========================
// User-Facing Routes
// ========================

/**
 * @swagger
 * /api/gamification/profile:
 *   get:
 *     summary: Get the game profile for the authenticated user
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A single, populated game profile for the logged-in user.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/profile", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getGameProfileForUser(req, res)
);

/**
 * @swagger
 * /api/gamification/leaderboard:
 *   get:
 *     summary: Get the public leaderboard
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of the top users, sorted by net worth.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/leaderboard", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getLeaderboard(req, res)
);

/**
 * @swagger
 * /api/gamification/items:
 *   get:
 *     summary: Get all purchasable virtual items
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of purchasable virtual items.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/items", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getVirtualItems(req, res)
);

/**
 * @swagger
 * /api/gamification/items/purchase:
 *   post:
 *     summary: Purchase a virtual item
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: The 'item_id_string' of the item to purchase.
 *               session_id:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Purchase successful.
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/items/purchase", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.purchaseVirtualItem(req, res)
);

/**
 * @swagger
 * /api/gamification/action:
 *   post:
 *     summary: Log a user action and receive rewards
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action_type:
 *                 type: string
 *               session_id:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       '200':
 *         description: Action logged successfully.
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/action", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.logAction(req, res)
);


// ========================
// Management Routes
// ========================

// --- Game Event Management Routes ---
/**
 * @swagger
 * /api/gamification/events/manage:
 *   post:
 *     summary: (Backdoor) Create a new game event
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameEvent'
 *     responses:
 *       '201':
 *         description: Event created successfully.
 */
router.post("/events/manage", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.createEvent(req, res)
);

/**
 * @swagger
 * /api/gamification/events/manage/all:
 *   get:
 *     summary: Get all game events
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all game events.
 */
router.get("/events/manage/all", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getAllEvents(req, res)
);

/**
 * @swagger
 * /api/gamification/events/manage/user/{userId}:
 *   get:
 *     summary: Get all events for a specific user
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List of events for the user.
 */
router.get("/events/manage/user/:userId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getEventsByUserId(req, res)
);

/**
 * @swagger
 * /api/gamification/events/manage/{eventId}:
 *   delete:
 *     summary: Delete a game event by its ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Event deleted successfully.
 */
router.delete("/events/manage/:eventId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.deleteEvent(req, res)
);


// --- Profile Management Routes ---
/**
 * @swagger
 * /api/gamification/profiles/manage:
 *   post:
 *     summary: Create a new game profile
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameProfile'
 *     responses:
 *       '201':
 *         description: Profile created successfully.
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/profiles/manage", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.createGameProfile(req, res)
);

/**
 * @swagger
 * /api/gamification/profiles/manage/all:
 *   get:
 *     summary: Get all game profiles
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all game profiles.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/profiles/manage/all", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getAllGameProfiles(req, res)
);

/**
 * @swagger
 * /api/gamification/profiles/manage/{userId}:
 *   get:
 *     summary: Get a single game profile by user ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Single game profile retrieved.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/profiles/manage/:userId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getGameProfileByUserId(req, res)
);

/**
 * @swagger
 * /api/gamification/profiles/manage/{userId}:
 *   patch:
 *     summary: Update a game profile by user ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *       '200':
 *         description: Profile updated successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/profiles/manage/:userId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.updateGameProfile(req, res)
);

/**
 * @swagger
 * /api/gamification/profiles/manage/{userId}:
 *   delete:
 *     summary: Delete a game profile by user ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Profile deleted successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/profiles/manage/:userId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.deleteGameProfile(req, res)
);

// --- Virtual Item Management Routes ---

/**
 * @swagger
 * /api/gamification/items/manage:
 *   post:
 *     summary: Create a new virtual item
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameVirtualItem'
 *     responses:
 *       '201':
 *         description: Item created successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/items/manage", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.createVirtualItem(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/all:
 *   get:
 *     summary: Get all virtual items
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all virtual items.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/items/manage/all", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getAllVirtualItems(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/{itemId}:
 *   get:
 *     summary: Get a single virtual item by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Single virtual item retrieved.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/items/manage/:itemId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getVirtualItemById(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/{itemId}:
 *   patch:
 *     summary: Update a virtual item by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *       '200':
 *         description: Item updated successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/items/manage/:itemId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.updateVirtualItem(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/{itemId}:
 *   delete:
 *     summary: Delete a virtual item by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Item deleted successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/items/manage/:itemId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.deleteVirtualItem(req, res)
);

// --- Badge Management Routes ---

/**
 * @swagger
 * /api/gamification/badges/manage:
 *   post:
 *     summary: Create a new badge
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameBadge'
 *     responses:
 *       '201':
 *         description: Badge created successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/badges/manage", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.createBadge(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/all:
 *   get:
 *     summary: Get all badges
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all badges.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/badges/manage/all", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getAllBadges(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/{badgeId}:
 *   get:
 *     summary: Get a single badge by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Single badge retrieved.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/badges/manage/:badgeId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getBadgeById(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/{badgeId}:
 *   patch:
 *     summary: Update a badge by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
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
 *       '200':
 *         description: Badge updated successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/badges/manage/:badgeId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.updateBadge(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/{badgeId}:
 *   delete:
 *     summary: Delete a badge by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Badge deleted successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/badges/manage/:badgeId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.deleteBadge(req, res)
);

// --- Quest Management Routes ---

/**
 * @swagger
 * /api/gamification/quests/manage:
 *   post:
 *     summary: Create a new quest
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameQuest'
 *     responses:
 *       '201':
 *         description: Quest created successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/quests/manage", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.createQuest(req, res)
);

/**
 * @swagger
 * /api/gamification/quests/manage/all:
 *   get:
 *     summary: Get all quests
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all quests.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/quests/manage/all", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getAllQuests(req, res)
);

/**
 * @swagger
 * /api/gamification/quests/manage/{questId}:
 *   get:
 *     summary: Get a single quest by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Single quest retrieved.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/quests/manage/:questId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getQuestById(req, res)
);

/**
 * @swagger
 * /api/gamification/quests/manage/{questId}:
 *   patch:
 *     summary: Update a quest by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questId
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
 *       '200':
 *         description: Quest updated successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/quests/manage/:questId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.updateQuest(req, res)
);

/**
 * @swagger
 * /api/gamification/quests/manage/{questId}:
 *   delete:
 *     summary: Delete a quest by ID
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Quest deleted successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/quests/manage/:questId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.deleteQuest(req, res)
);

export default router;