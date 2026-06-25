const express = require('express')
const VocabularyController = require('../controllers/vocabulary.controller.js')
const AuthenticateToken = require('../middlewares/authenticateToken.js')

const vocabularyRouter = express.Router()
const vocabularyController = new VocabularyController()
const authenticateToken = new AuthenticateToken()

// GET /api/vocabulary
vocabularyRouter.get('/', authenticateToken.authenticateToken, vocabularyController.getUserVocabulary)

// bookmarks
vocabularyRouter.get('/bookmarks', authenticateToken.authenticateToken, vocabularyController.getBookmarks)

// add bookmark
vocabularyRouter.post('/bookmark/:wordId', authenticateToken.authenticateToken, vocabularyController.addBookmark)

// remove bookmark
vocabularyRouter.delete('/bookmark/:wordId', authenticateToken.authenticateToken, vocabularyController.removeBookmark)

module.exports = { vocabularyRouter }