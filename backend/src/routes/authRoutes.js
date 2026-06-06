const express = require('express');
const AuthController = require('../controllers/auth.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

// essential modules
const authRouter = express.Router();
const authController = new AuthController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/auth/init-table:
 *   get:
 *     tags: [Auth]
 *     summary: Initialize (create) users table if it does not exist
 *     responses:
 *       200:
 *         description: Table created or already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicSuccess'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// authRouter.get('/init-table', authController.createTable);

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
 *     summary: Login with username & password
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
 * /api/auth/google-login:
 *   post:
 *     tags: [Auth]
 *     summary: Login / register via Google OAuth ID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequest'
 *     responses:
 *       200:
 *         description: Google login success
 *       400:
 *         description: Invalid Google credential
 */
// authRouter.post('/google-login', authController.googleLogin);

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
 * /api/auth/verify-token:
 *   get:
 *     tags: [Auth]
 *     summary: Verify validity of access token
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicSuccess'
 *       401:
 *         description: Unauthorized / invalid token
 */
// authRouter.get('/verify-token', authenticateToken.authenticateToken, authController.verifyToken);

/**
 * @openapi
 * /api/auth/send-verification-email:
 *   post:
 *     tags: [Auth]
 *     summary: Send verification email (if not verified)
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Email sent (or already verified)
 *       429:
 *         description: Rate limited
 */
// authRouter.post('/send-verification-email', authController.sendVerificationEmail);

/**
 * @openapi
 * /api/auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verify email using token
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
// authRouter.get('/verify-email', authController.verifyEmail);

/**
 * @openapi
 * /api/auth/password/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequestInit'
 *     responses:
 *       200:
 *         description: Reset email sent (always generic)
 */
// authRouter.post('/password/request', authController.requestPassword);

/**
 * @openapi
 * /api/auth/password/reset:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetConfirm'
 *     responses:
 *       200:
 *         description: Password reset success
 *       400:
 *         description: Invalid token / payload
 */
// authRouter.post('/password/reset', authController.resetPassword);

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