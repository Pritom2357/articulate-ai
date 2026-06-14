const express = require('express');
const CurriculumController = require('../controllers/curriculum.controller.js');

const curriculumRouter = express.Router();
const curriculumController = new CurriculumController();

// chapters
curriculumRouter.get('/chapters', curriculumController.getAllChapters);
curriculumRouter.get('/chapters/:id', curriculumController.getChapterById);
curriculumRouter.get('/chapters/:chapterId/lessons', curriculumController.getLessonsByChapterId);

// lessons
curriculumRouter.get('/lessons/:id', curriculumController.getLessonById);
curriculumRouter.get('/lessons/:lessonId/words', curriculumController.getWordsByLessonId);

// words
curriculumRouter.get('/words/:id', curriculumController.getWordById);
curriculumRouter.post('/words/bulk', curriculumController.getWordsByIds);

// tests
curriculumRouter.get('/tests', curriculumController.getTests);
curriculumRouter.get('/tests/:id', curriculumController.getTestById);

// searchbar
curriculumRouter.get('/search', curriculumController.search);


module.exports = { curriculumRouter };