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

    getUserNotifications = async (req, res) => {
        try {
            const userId = req.user.id;
            const xpLogsQuery = `
                SELECT log_id, amount, reason, created_at
                FROM user_xp_log
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 10;
            `;
            const xpLogs = await this.progressModel.db_connection.query_executor(xpLogsQuery, [userId]);

            const notifications = [
                {
                    id: 'welcome',
                    title: 'Welcome to Articulate AI! 🎉',
                    description: 'আপনার ইংরেজি শেখার যাত্রা আজই শুরু করুন। গাইড টিউটর নির্বাচন করে অনবোর্ডিং সম্পন্ন করুন।',
                    created_at: new Date(Date.now() - 3600000 * 24),
                    type: 'system',
                    read: true
                }
            ];

            for (const log of xpLogs.rows) {
                let title = 'XP Gained! ⚡';
                let desc = `You earned +${log.amount} XP for ${log.reason.replace('_', ' ')}.`;
                let type = 'xp';

                if (log.reason === 'lesson_complete') {
                    title = 'Lesson Completed! 📚';
                    desc = `লেসন শেষ করে আপনি +${log.amount} XP অর্জন করেছেন।`;
                    type = 'lesson';
                } else if (log.reason === 'chapter_complete') {
                    title = 'Chapter Unlocked! 🏆';
                    desc = `চ্যাপ্টার সম্পন্ন করে আপনি +${log.amount} XP বোনাস পেয়েছেন।`;
                    type = 'chapter';
                } else if (log.reason === 'test_complete' || log.reason === 'test_completed') {
                    title = 'Speaking Evaluation Done! 🎙️';
                    desc = `উচ্চারণ পরীক্ষায় অংশ নিয়ে +${log.amount} XP অর্জন করেছেন।`;
                    type = 'test';
                }

                notifications.push({
                    id: `log_${log.log_id}`,
                    title,
                    description: desc,
                    created_at: log.created_at,
                    type,
                    read: false
                });
            }

            const badgeQuery = `
                SELECT ub.badge_id, ub.earned_at, b.title, b.description
                FROM user_badges ub
                JOIN badges b ON ub.badge_id = b.badge_id
                WHERE ub.user_id = $1
                ORDER BY ub.earned_at DESC;
            `;
            const badges = await this.progressModel.db_connection.query_executor(badgeQuery, [userId]);

            for (const badge of badges.rows) {
                notifications.push({
                    id: `badge_${badge.badge_id}`,
                    title: `Badge Unlocked: ${badge.title} 🎖️`,
                    description: `${badge.description} (অভিনন্দন! নতুন ব্যাজ অর্জিত হয়েছে)`,
                    created_at: badge.earned_at,
                    type: 'badge',
                    read: false
                });
            }

            notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return res.status(200).json({ success: true, notifications });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

module.exports = ProgressController