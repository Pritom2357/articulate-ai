const aiService = require('../services/aiService.js')

class ChatbotController {
    generalChat = async (req, res) => {
        try {
            const { messages } = req.body;
            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ success: false, error: 'messages array is required' });
            }
            const response = await aiService.generateChatResponse(messages);
            return res.status(200).json({ success: true, response });
        } catch (error) {
            console.error('AI general chat controller error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }


    textToSpeech = async (req, res) => {
        try {
            const { text, voice } = req.body
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return res.status(400).json({ success: false, error: 'text is required' })
            }

            // Limit text length to prevent abuse
            if (text.length > 2000) {
                return res.status(400).json({ success: false, error: 'Text too long (max 2000 characters)' })
            }

            const audioBuffer = await aiService.textToSpeech(text.trim(), voice || 'nova')

            // Send as MP3 binary
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length,
                'Cache-Control': 'no-cache',
            })

            return res.send(audioBuffer)
        } catch (error) {
            console.error('TTS controller error:', error)
            return res.status(500).json({ success: false, error: error.message || 'TTS failed' })

        }
    }
}

module.exports = ChatbotController