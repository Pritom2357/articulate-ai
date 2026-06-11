const express = require('express');
const ProgressController = require('../controllers/progress.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

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