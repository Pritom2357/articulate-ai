const ProgressModel = require('../models/progress.model')

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
}

module.exports = ProgressController