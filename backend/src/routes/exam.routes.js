const express = require('express');
const examController = require('../controllers/exam.controller.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const multer = require('multer');

const examRouter = express.Router();
const authenticateToken = new AuthenticateToken();

// Configure multer for audio uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per file
});

// All exam routes require auth
examRouter.use(authenticateToken.authenticateToken);

// Order matters: /history before /:id so it doesn't get caught as an ID
examRouter.get('/history', examController.getExamHistory);
examRouter.post('/generate', examController.generateExam);
examRouter.get('/:id', examController.getExamById);
examRouter.get('/:id/results', examController.getExamResults);
examRouter.post('/:id/submit', upload.any(), examController.submitExam);
examRouter.post('/:id/retake', examController.retakeExam);
examRouter.get('/answer/:answerId/audio', examController.getAnswerAudio);

module.exports = { examRouter };
