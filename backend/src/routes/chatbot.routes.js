const express = require('express')
const ChatbotController = require('../controllers/chatbot.controller.js')
const AuthenticateToken = require('../middlewares/authenticateToken.js')

const chatbotRouter = express.Router()
const chatbotController = new ChatbotController()
const authenticateToken = new AuthenticateToken()

chatbotRouter.post(
    '/chat',
    authenticateToken.authenticateToken,
    chatbotController.generalChat
)

chatbotRouter.get(
    '/history',
    authenticateToken.authenticateToken,
    chatbotController.getHistory
)

chatbotRouter.post(
    '/quick-chat',
    authenticateToken.authenticateToken,
    chatbotController.quickChat
)

chatbotRouter.get(
    '/word-lookup',
    authenticateToken.authenticateToken,
    chatbotController.wordLookup
)

chatbotRouter.post(
    '/tts',
    authenticateToken.authenticateToken,
    chatbotController.textToSpeech
)

module.exports = { chatbotRouter }
