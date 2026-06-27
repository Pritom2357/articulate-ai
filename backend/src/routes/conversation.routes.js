const express = require('express');
const multer = require('multer');
const AuthenticateToken = require('../middlewares/authenticateToken');
const conversationController = require('../controllers/conversation.controller');

const conversationRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const authenticateToken = new AuthenticateToken();

conversationRouter.post(
  '/start',
  authenticateToken.authenticateToken,
  conversationController.startSession
);

conversationRouter.post(
  '/:id/turn',
  authenticateToken.authenticateToken,
  upload.single('audio'),
  conversationController.submitTurn
);

conversationRouter.post(
  '/:id/end',
  authenticateToken.authenticateToken,
  conversationController.endSession
);

module.exports = { conversationRouter };
