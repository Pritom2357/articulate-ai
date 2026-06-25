const express = require('express');
const NotificationsController = require('../controllers/notifications.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const notificationsRouter = express.Router();
const controller = new NotificationsController();
const auth = new AuthenticateToken();

notificationsRouter.get('/', auth.authenticateToken, controller.getUserNotifications);
notificationsRouter.get('/unread-count', auth.authenticateToken, controller.getUnreadCount);
notificationsRouter.patch('/read-all', auth.authenticateToken, controller.markAllAsRead);
notificationsRouter.patch('/:id/read', auth.authenticateToken, controller.markAsRead);
notificationsRouter.delete('/:id', auth.authenticateToken, controller.deleteOne);
notificationsRouter.delete('/', auth.authenticateToken, controller.deleteAll);

module.exports = { notificationsRouter };