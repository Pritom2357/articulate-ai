const express = require('express');
const router = express.Router();
const multer = require('multer');

// Setup multer to parse multipart/form-data. We accept ANY files since field names are dynamic (e.g. audio_6).
const upload = multer({ storage: multer.memoryStorage() });

const examController = require('../controllers/exam.controller');

// Generate a new exam
router.post('/generate', examController.generateExam);

// Get user's exam history
router.get('/history', examController.getExamHistory);

// Get a specific exam (without answers)
router.get('/:examId', examController.getExam);

// Submit exam answers (with audio files)
router.post('/:examId/submit', upload.any(), examController.submitExam);

// Get full results of an evaluated exam
router.get('/:examId/results', examController.getExamResults);

// Retake an existing exam
router.post('/:examId/retake', examController.retakeExam);

module.exports = { examRouter: router };
