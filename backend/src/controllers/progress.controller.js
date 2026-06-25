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


    getStreakCalendar = async (req, res) => {
        try {
            const userId = req.user.id
            const now = new Date()

            const year = parseInt(req.query.year) || now.getFullYear()
            const month = parseInt(req.query.month) || now.getMonth() + 1

            if (month < 1 || month > 12) {
                return res.status(400).json({ success: false, error: 'month must be 1–12' })
            }

            const activeDates = await this.progressModel.getStreakCalendar(userId, year, month)

            return res.status(200).json({
                success: true,
                year,
                month,
                activeDates
            })
        }
        catch (error) {
            console.error('Failed to fetch streak calendar:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    // leaderboard based of xp
    getLeaderboard = async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 200

            const leaderboard = await this.progressModel.getLeaderboard(limit)

            return res.status(200).json({ success: true, leaderboard })
        }
        catch (error) {
            console.error('Failed to fetch leaderboard:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getBadges = async (req, res) => {
        try {
            const userId = req.user.id

            const allBadges = await this.progressModel.getUserBadges(userId)
            const earnedCount = allBadges.filter(b => b.earned).length

            return res.status(200).json({
                success: true,
                badges: allBadges,
                earnedCount,
                totalCount: allBadges.length
            })
        }
        catch (error) {
            console.error('Failed to fetch badges:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getXPLog = async (req, res) => {
        try {
            const userId = req.user.id
            const limit = parseInt(req.query.limit) || 25

            const logs = await this.progressModel.getXPLog(userId, limit)

            return res.status(200).json({ success: true, logs })
        }
        catch (error) {
            console.error('Failed to fetch XP log:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

}

module.exports = ProgressController