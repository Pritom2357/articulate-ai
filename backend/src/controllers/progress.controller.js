const ProgressModel = require('../models/progress.model')
const aiService = require('../services/aiService.js')

class ProgressController {
    constructor() {
        this.progressModel = new ProgressModel()
    }


    getDueCards = async (req, res) => {
        try {
            const userId = req.user.id
            const cards = await this.progressModel.getDueCards(userId)

            if (!cards) {
                return res.status(404).json({ success: false, error: 'No due cards found' })
            }

            return res.status(200).json({ success: true, cards })
        }
        catch (error) {
            console.error('Failed to fetch due cards:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    updateSrsCard = async (req, res) => {
        try {
            const userId = req.user.id
            const { wordId, score } = req.body

            if (!wordId || (!score && score !== 0)) {
                return res.status(400).json({ success: false, error: 'wordId and score are required' })
            }

            const updated = await this.progressModel.updateSrsCard(userId, wordId, score)
            if (!updated) {
                return res.status(404).json({ success: false, error: 'Card not found or update failed' })
            }

            return res.status(200).json({ success: true, card: updated })
        }
        catch (error) {
            console.error('Failed to review card:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    markLessonComplete = async (req, res) => {
        try {
            const userId = req.user.id
            const { lessonId, score } = req.body

            if (!lessonId || (!score && score !== 0)) {
                return res.status(400).json({ success: false, error: 'lessonId and score are required' })
            }

            const { lesson, stats } = await this.progressModel.markLessonComplete(userId, lessonId, score)

            if (!lesson) {
                return res.status(500).json({ success: false, error: 'Failed to mark lesson complete' })
            }

            return res.status(200).json({
                success: true,
                lesson: lesson,
                xp: stats.xp,
                level: stats.level
            })
        }
        catch (error) {
            console.error('Failed to complete lesson:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getProgress = async (req, res) => {
        try {
            const userId = req.user.id
            const progress = await this.progressModel.getUserProgress(userId)

            if (!progress) {
                return res.status(404).json({ success: false, error: 'Progress not found' })
            }

            return res.status(200).json({ success: true, progress })
        }
        catch (error) {
            console.error('Failed to fetch progress:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    assessPronunciation = async (req, res) => {
        try {
            const userId = req.user.id;
            const { referenceText, wordId, testId, questionId, attemptType, phraseId } = req.body || {};
            
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'Audio file is required' });
            }
            if (!referenceText) {
                return res.status(400).json({ success: false, error: 'referenceText is required' });
            }

            const result = await aiService.assessPronunciation(req.file.buffer, referenceText);

            if (result.success) {
                // If wordId is provided, update user SRS progress
                if (wordId) {
                    await this.progressModel.updateSrsCard(userId, parseInt(wordId), result.overall_score);
                }
                
                // If testId and questionId are provided, log pronunciation attempt in DB
                if (testId && questionId) {
                    await this.progressModel.logPronunciationAttempt(userId, {
                        testId: parseInt(testId),
                        questionId: parseInt(questionId),
                        attemptType: attemptType || 'WORD',
                        wordId: wordId ? parseInt(wordId) : null,
                        phraseId: phraseId ? parseInt(phraseId) : null,
                        score: result.overall_score,
                        feedback: result.feedback,
                        isCorrect: result.overall_score >= 60
                    });
                }
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Pronunciation assessment controller error:', error);
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
}

module.exports = ProgressController