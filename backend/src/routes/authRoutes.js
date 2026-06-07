const express = require('express');
const AuthController = require('../controllers/auth.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

// essential modules
const authRouter = express.Router();
const authController = new AuthController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created (may require email verification)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/BasicSuccess'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Conflict (duplicate email/username)
 */
authRouter.post('/register', authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email & password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthLoginResponse'
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current logged in user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/me', authenticateToken.authenticateToken, authController.getProfile);

/**
 * @openapi
 * /api/auth/logout/{userId}:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user (invalidate refresh token)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicSuccess'
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/logout/:userId', authenticateToken.authenticateToken, authController.logout);

/**
 * @openapi
 * /api/auth/password/change:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (authenticated)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChangeRequest'
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/password/change', authenticateToken.authenticateToken, authController.changePassword);

module.exports = {
    authRouter
};