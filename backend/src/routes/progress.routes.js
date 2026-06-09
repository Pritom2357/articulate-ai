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
    '/progress/lesson',
    authenticateToken.authenticateToken,
    progressController.markLessonComplete
);

progressRouter.get(
    '/progress',
    authenticateToken.authenticateToken,
    progressController.getProgress
);

module.exports = { progressRouter };