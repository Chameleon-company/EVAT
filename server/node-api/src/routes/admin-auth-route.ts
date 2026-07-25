import express from 'express';
import {
  adminLogin,
  updateAdminCredentials,
  verifyAdmin2FA
} from '../controllers/admin-auth-controller';
import { isAdminAuthenticated } from '../middlewares/is-admin-auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Auth
 *   description: Routes for admin login and 2FA authentication
 */

/**
 * @swagger
 * /api/admin-auth/login:
 *   post:
 *     summary: Admin login (Step 1)
 *     description: Authenticates admin and sends a 2FA code to the registered email.
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: Verification code sent
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', adminLogin);

/**
 * @swagger
 * /api/admin-auth/verify-2fa:
 *   post:
 *     summary: Admin login (Step 2 - 2FA verification)
 *     description: Verifies the 2FA code and issues a JWT if successful.
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - code
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               code:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: JWT token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       403:
 *         description: Invalid or expired 2FA code
 *       404:
 *         description: Admin not found
 */
router.post('/verify-2fa', verifyAdmin2FA);

/**
 * @swagger
 * /api/admin-auth/update-credentials:
 *   put:
 *     summary: Update admin username and password
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin credentials updated
 *       401:
 *         description: Unauthorized or token missing/invalid
 */
router.put('/update-credentials', isAdminAuthenticated, updateAdminCredentials);

export default router;
