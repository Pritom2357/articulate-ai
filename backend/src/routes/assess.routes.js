const express = require('express');
const AssessController = require('../controllers/assess.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const assessRouter = express.Router();
const assessController = new AssessController();
const authenticateToken = new AuthenticateToken();

// Pronunciation and Conversation AI Assessment
assessRouter.post(
    '/pronunciation/assess',
    authenticateToken.authenticateToken,
    upload.single('audio'),
    assessController.assessPronunciation
);

assessRouter.post(
    '/pronunciation/feedback',
    authenticateToken.authenticateToken,
    assessController.pronunciationFeedback
);

assessRouter.post(
    '/conversation/assess',
    authenticateToken.authenticateToken,
    assessController.assessConversation
);

assessRouter.get(
    '/rag-session',
    authenticateToken.authenticateToken,
    assessController.ragSession
);

assessRouter.post(
    '/ai-chat',
    authenticateToken.authenticateToken,
    assessController.generalChat
);

assessRouter.post(
    '/tests/submit',
    authenticateToken.authenticateToken,
    assessController.submitTestAttempt
);

module.exports = { assessRouter };
