const ProgressModel = require('../models/progress.model')
const aiService = require('../services/aiService.js')
const bus = require('../events/eventBus.js')
const Events = require('../events/eventsNames.js')
const banglaRiskPhonemes = require('../constants/banglaRiskPhonemes.js')

const AUDIO_QUALITY_GATE = 50;
const WEAK_PHONEME_THRESHOLD = 70;

class AssessController {
    constructor() {
        this.progressModel = new ProgressModel()
    }

    assessPronunciation = async (req, res) => {
        try {
            const userId = req.user.id;
            const { referenceText, wordId } = req.body || {};

            if (!req.file) {
                return res.status(400).json({ success: false, error: 'Audio file is required' });
            }
            if (!referenceText) {
                return res.status(400).json({ success: false, error: 'referenceText is required' });
            }

            console.log('[assessPronunciation controller] received', {
                userId,
                referenceText,
                wordId,
                mimeType: req.file.mimetype,
                originalName: req.file.originalname,
                sizeBytes: req.file.size
            });

            const result = await aiService.assessPronunciation(req.file.buffer, referenceText, req.file.mimetype);

            if (!result.success) {
                return res.status(200).json(result);
            }

            // Audio quality gate — reject without writing anything if the recording itself is too poor to score fairly.
            if (result.audio_quality_score != null && result.audio_quality_score < AUDIO_QUALITY_GATE) {
                return res.status(200).json({ success: true, rejected: true, reason: 'poor_audio', ...result });
            }

            // If wordId is provided, update user SRS progress
            if (wordId) {
                await this.progressModel.updateSrsCard(userId, parseInt(wordId), result.overall_score);
            }

            // Phoneme-level scoring: history log + rolling summary + mastery XP + fail-streak RAG trigger
            if (result.phonemes && result.phonemes.length > 0) {
                const { ragTriggerPhonemes } = await this.progressModel.logPhonemeScores(
                    userId,
                    wordId ? parseInt(wordId) : null,
                    result.phonemes
                );

                for (const phoneme of ragTriggerPhonemes) {
                    bus.asyncEmit(Events.RAG_TRIGGER, { userId, phoneme });
                }
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Pronunciation assessment controller error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
        }
    }

    /**
     * Slow path, called separately so the score response above never waits on an LLM call.
     * Enriches phonemes scoring below WEAK_PHONEME_THRESHOLD with Bangla risk-phoneme tips,
     * then asks the LLM to synthesize one short actionable Bangla tip.
     */
    pronunciationFeedback = async (req, res) => {
        try {
            const { phonemeScores } = req.body || {};
            if (!Array.isArray(phonemeScores)) {
                return res.status(400).json({ success: false, error: 'phonemeScores array is required' });
            }

            const weakPhonemes = phonemeScores
                .filter(p => p.score < WEAK_PHONEME_THRESHOLD)
                .map(p => ({
                    phoneme: p.phoneme,
                    score: p.score,
                    tipBn: banglaRiskPhonemes[p.phoneme] || null
                }));

            const tipBn = await aiService.getPronunciationFeedback(weakPhonemes);

            return res.status(200).json({ success: true, tipBn });
        } catch (error) {
            console.error('Pronunciation feedback controller error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
        }
    }

    assessConversation = async (req, res) => {
        try {
            const userId = req.user.id;
            const { chatMessages, chapterId } = req.body || {};

            if (!chatMessages || !chapterId) {
                return res.status(400).json({ success: false, error: 'chatMessages and chapterId are required' });
            }

            // Fetch chapter conversation key points
            const chapter = await this.progressModel.getChapterConversationPoints(parseInt(chapterId));
            if (!chapter) {
                return res.status(404).json({ success: false, error: 'Chapter not found' });
            }

            const keyPoints = chapter.conversation_key_points || [];
            const assessment = await aiService.assessConversation(chatMessages, keyPoints);

            // Save assessment results if needed or just return to user
            await this.progressModel.saveConversationScore(userId, parseInt(chapterId), assessment.accuracy_score);

            return res.status(200).json({ success: true, assessment });
        } catch (error) {
            console.error('Conversation assessment controller error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
        }
    }

    ragSession = async (req, res) => {
        try {
            const userId = req.user.id;
            const userProfile = await this.progressModel.getUserProfile(userId);
            if (!userProfile) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Get user's weak words (wrong_count > 0 in user_word_progress)
            const weakWords = await this.progressModel.getUserWeakWords(userId);

            const level = userProfile.assessed_level || 'A1';
            const name = userProfile.name || 'Learner';

            const recommendation = await aiService.generateNextSessionRAG(name, level, weakWords);

            return res.status(200).json({
                success: true,
                recommendation,
                level,
                weakWordsCount: weakWords.length
            });
        } catch (error) {
            console.error('RAG session generation controller error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
        }
    }

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

    submitTestAttempt = async (req, res) => {
        try {
            const userId = req.user.id;
            const { testId, score, obtainedMarks } = req.body;
            if (!testId) {
                return res.status(400).json({ success: false, error: 'testId is required' });
            }

            const query = `
                INSERT INTO test_progress (user_id, test_id, score, obtained_marks, status, completed_at)
                VALUES ($1, $2, $3, $4, 'EVALUATED', NOW())
                ON CONFLICT DO NOTHING
                RETURNING *;
            `;
            const result = await this.progressModel.db_connection.query_executor(query, [
                userId,
                testId,
                score || 0,
                obtainedMarks || 0
            ]);

            // Add XP for completing a test
            const stats = await this.progressModel.addXP(userId, 40, 'test_completed');

            return res.status(200).json({
                success: true,
                progress: result.rows[0] || null,
                xp: stats.xp,
                level: stats.level
            });
        } catch (error) {
            console.error('Failed to submit test attempt:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

module.exports = AssessController;
