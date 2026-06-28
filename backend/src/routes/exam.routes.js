const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const multer = require('multer');

const auth = new AuthenticateToken();
const verifyToken = auth.authenticateToken;

// Configure multer for audio uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per file
});

// All exam routes require auth
router.use(verifyToken);

// Order matters: /history before /:id so it doesn't get caught as an ID
router.get('/history', examController.getExamHistory);
router.post('/generate', examController.generateExam);
router.get('/:id', examController.getExamById);
router.get('/:id/results', examController.getExamResults);
router.post('/:id/submit', upload.any(), examController.submitExam);
router.post('/:id/retake', examController.retakeExam);
router.get('/answer/:answerId/audio', examController.getAnswerAudio);

module.exports = router;
