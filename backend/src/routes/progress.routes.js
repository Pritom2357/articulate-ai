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

// GET /api/progress
progressRouter.get(
    '/',
    authenticateToken.authenticateToken,
    progressController.getProgress
);

progressRouter.get(
    '/leaderboard',
    authenticateToken.authenticateToken,
    progressController.getLeaderboard
);

progressRouter.get(
    '/streak-calendar',
    authenticateToken.authenticateToken,
    progressController.getStreakCalendar
);

progressRouter.get(
    '/badges',
    authenticateToken.authenticateToken,
    progressController.getBadges
);

progressRouter.get(
    '/xp-log',
    authenticateToken.authenticateToken,
    progressController.getXPLog
);

module.exports = { progressRouter };