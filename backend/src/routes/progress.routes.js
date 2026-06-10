const express = require('express');
const ProgressController = require('../controllers/progress.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const progressRouter = express.Router();
const progressController = new ProgressController();
const authenticateToken = new AuthenticateToken();

// Flashcard SRS endpoints
progressRouter.get(
    '/flashcards/due',
    authenticateToken.authenticateToken,
    progressController.getDueCards
);

progressRouter.post(
    '/flashcards/review',
    authenticateToken.authenticateToken,
    progressController.updateSrsCard
);

// Pronunciation and Conversation AI Assessment
progressRouter.post(
    '/pronunciation/assess',
    authenticateToken.authenticateToken,
    upload.single('audio'),
    progressController.assessPronunciation
);

progressRouter.post(
    '/conversation/assess',
    authenticateToken.authenticateToken,
    progressController.assessConversation
);

progressRouter.get(
    '/rag-session',
    authenticateToken.authenticateToken,
    progressController.ragSession
);

// Progress endpoints
progressRouter.post(
    '/lesson',
    authenticateToken.authenticateToken,
    progressController.markLessonComplete
);

progressRouter.get(
    '/',
    authenticateToken.authenticateToken,
    progressController.getProgress
);

module.exports = { progressRouter };