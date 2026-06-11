const express = require('express');
const NotificationsController = require('../controllers/notifications.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const notificationsRouter = express.Router();
const notificationsController = new NotificationsController();
const authenticateToken = new AuthenticateToken();

notificationsRouter.get(
    '/',
    authenticateToken.authenticateToken,
    notificationsController.getUserNotifications
);

module.exports = { notificationsRouter };
