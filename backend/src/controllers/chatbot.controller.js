const aiService = require('../services/aiService.js')
const ProgressModel = require('../models/progress.model.js')
const ChatModel = require('../models/chat.model.js')
const DB_Connection = require('../database/db.js')

class ChatbotController {
    constructor() {
        this.progressModel = new ProgressModel()
        this.chatModel = new ChatModel()
        this.db = DB_Connection.getInstance()
    }

    generalChat = async (req, res) => {
        try {
            const userId = req.user.id
            const { messages, mistakeCheck = false, includeProfile = false, sessionId: clientSessionId } = req.body
            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ success: false, error: 'messages array is required' })
            }

            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''

            // Auto-detect progress-related questions — inject profile regardless of toggle
            const PROGRESS_KEYWORDS = ['progress', 'level', 'xp', 'streak', 'lesson', 'badge', 'score', 'performance', 'how am i', 'achievement', 'rank', 'weak word', 'journey', 'done so far', 'completed']
            const isProgressQuestion = PROGRESS_KEYWORDS.some(kw => lastUserMsg.toLowerCase().includes(kw))
            const shouldIncludeProfile = includeProfile || isProgressQuestion

            // Resolve or create session
            let sessionId = clientSessionId
            if (!sessionId) {
                sessionId = await this.chatModel.getOrCreateSession(userId)
            }

            // Build profile context when profile tracker is ON or progress intent detected
            let profileBlock = null
            if (shouldIncludeProfile) {
                try {
                    const [profile, progress, weakWords] = await Promise.all([
                        this.progressModel.getUserProfile(userId),
                        this.progressModel.getUserProgress(userId),
                        this.progressModel.getUserWeakWords(userId),
                    ])
                    if (profile) {
                        const completedLessons = Object.values(progress?.lessons || {}).filter(l => l.status === 'COMPLETED').length
                        const totalLessons = Object.keys(progress?.lessons || {}).length
                        const badgeCount = (progress?.badges || []).length
                        const ww = (weakWords || []).slice(0, 8).map(w => `"${w.word}" (${w.bangla_meaning})`).join(', ')

                        profileBlock = `
=== LEARNER PROFILE — answer progress questions using these exact numbers ===
Name: ${profile.name} | Assessed Level: ${profile.assessed_level || 'A1'}
XP: ${progress?.xp || 0} | Streak: ${progress?.streak_days || 0} days in a row
Lessons completed: ${completedLessons} out of ${totalLessons} total | Badges earned: ${badgeCount}
Weak words to still practice: ${ww || 'none yet — great job!'}
=== END PROFILE ===`
                    }
                } catch (e) {
                    console.error('[chatbot] profile fetch failed (non-fatal):', e.message)
                }
            }

            // Save the incoming user message to DB
            await this.chatModel.saveMessage(sessionId, userId, 'user', lastUserMsg, null).catch(e => {
                console.error('[chatbot] save user msg failed (non-fatal):', e.message)
            })

            // Run in parallel: main response + grammar check + word detection
            const [response, grammarErrors, wordQuery] = await Promise.all([
                aiService.generateChatWithContext(messages, profileBlock),
                mistakeCheck ? aiService.checkGrammar(lastUserMsg) : Promise.resolve(null),
                aiService.extractWordQuery(lastUserMsg),
            ])

            // Word lookup from DB, fallback to AI-generated word info
            let wordPanel = null
            if (wordQuery) {
                try {
                    const { rows } = await this.db.query_executor(
                        `SELECT word, bangla_meaning, ipa, syllables, audio_url, audio_url_m
                         FROM words WHERE LOWER(word) = LOWER($1) LIMIT 1`,
                        [wordQuery]
                    )
                    wordPanel = rows[0] || await aiService.generateWordInfo(wordQuery)
                } catch (e) {
                    console.error('[chatbot] word lookup failed (non-fatal):', e.message)
                    wordPanel = await aiService.generateWordInfo(wordQuery).catch(() => null)
                }
            }

            // Suppress the regular chat response text when the word panel is shown
            const finalResponse = wordPanel ? null : response
            const metadata = {}
            if (wordPanel) metadata.wordPanel = wordPanel
            if (grammarErrors) metadata.grammarErrors = grammarErrors

            // Save AI response to DB
            await this.chatModel.saveMessage(
                sessionId, userId, 'assistant', finalResponse,
                Object.keys(metadata).length ? metadata : null
            ).catch(e => {
                console.error('[chatbot] save assistant msg failed (non-fatal):', e.message)
            })

            return res.status(200).json({
                success: true,
                sessionId,
                response: finalResponse,
                grammarErrors,
                wordPanel,
            })
        } catch (error) {
            console.error('AI general chat controller error:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    getHistory = async (req, res) => {
        try {
            const userId = req.user.id
            const sessionId = parseInt(req.query.sessionId, 10)
            if (!sessionId) {
                return res.status(400).json({ success: false, error: 'sessionId is required' })
            }
            const rows = await this.chatModel.getHistory(userId, sessionId)
            // Rebuild frontend message shape from DB rows
            const messages = rows.map(r => ({
                role: r.role,
                content: r.content,
                ...(r.metadata?.wordPanel ? { wordPanel: r.metadata.wordPanel } : {}),
                ...(r.metadata?.grammarErrors ? { grammarErrors: r.metadata.grammarErrors } : {}),
            }))
            return res.status(200).json({ success: true, messages })
        } catch (error) {
            console.error('getHistory error:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    quickChat = async (req, res) => {
        try {
            const userId = req.user.id
            const { messages } = req.body
            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ success: false, error: 'messages array is required' })
            }

            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''

            // Fetch lightweight user context
            let userContext = ''
            try {
                const [profile, progress] = await Promise.all([
                    this.progressModel.getUserProfile(userId),
                    this.progressModel.getUserProgress(userId),
                ])
                if (profile) {
                    const completedLessons = Object.values(progress?.lessons || {}).filter(l => l.status === 'COMPLETED').length
                    userContext = `User: ${profile.name} | Level: ${profile.assessed_level || 'A1'} | XP: ${progress?.xp || 0} | Streak: ${progress?.streak_days || 0} days | Lessons done: ${completedLessons}`
                }
            } catch (e) { /* non-fatal */ }

            const response = await aiService.generateQuickResponse(messages, userContext)
            return res.status(200).json({ success: true, response })
        } catch (error) {
            console.error('Quick chat error:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    wordLookup = async (req, res) => {
        try {
            const q = (req.query.q || '').trim()
            if (!q) return res.status(400).json({ success: false, error: 'q param is required' })
            const { rows } = await this.db.query_executor(
                `SELECT word, bangla_meaning, ipa, syllables, audio_url, audio_url_m
                 FROM words WHERE LOWER(word) = LOWER($1) LIMIT 1`,
                [q]
            )
            return res.status(200).json({ success: true, word: rows[0] || null })
        } catch (error) {
            console.error('Word lookup error:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    textToSpeech = async (req, res) => {
        try {
            const { text, voice } = req.body
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return res.status(400).json({ success: false, error: 'text is required' })
            }
            if (text.length > 2000) {
                return res.status(400).json({ success: false, error: 'Text too long (max 2000 characters)' })
            }
            const audioBuffer = await aiService.textToSpeech(text.trim(), voice || 'nova')
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
