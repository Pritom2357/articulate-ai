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


// refresh
authRouter.post('/refresh', authController.refreshTokens);

module.exports = { authRouter };