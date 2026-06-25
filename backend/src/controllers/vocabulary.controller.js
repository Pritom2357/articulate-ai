const VocabularyModel = require('../models/vocabulary.model.js')

class VocabularyController {
    constructor() {
        this.vocabularyModel = new VocabularyModel()
    }


    getUserVocabulary = async (req, res) => {
        try {
            const userId = req.user.id
            const filter = req.query.filter || req.params.filter || 'all'
            const words = await this.vocabularyModel.getUserVocabulary(userId, filter)

            const vocabulary = words || []

            return res.status(200).json({
                success: true,
                vocabulary: vocabulary,
                total: vocabulary.length
            })
        } catch (error) {
            console.error('Get vocabulary error:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getBookmarks = async (req, res) => {
        try {
            const userId = req.user.id
            const bookmarks = await this.vocabularyModel.getBookmarks(userId)

            const bookmarkedWords = bookmarks || []

            return res.status(200).json({
                success: true,
                bookmarks: bookmarkedWords,
                total: bookmarkedWords.length
            })
        }
        catch (error) {
            console.error('Get bookmarks error:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    addBookmark = async (req, res) => {
        try {
            const userId = req.user.id
            const wordId = parseInt(req.params.wordId)

            if (!wordId) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid word ID'
                })
            }

            const bookmark = await this.vocabularyModel.addBookmark(userId, wordId)

            return res.status(201).json({
                success: true,
                message: 'Word bookmarked',
                bookmark
            })
        }
        catch (error) {
            console.error('Add bookmark error:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    removeBookmark = async (req, res) => {
        try {
            const userId = req.user.id
            const wordId = parseInt(req.params.wordId)

            if (!wordId) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid word ID'
                })
            }

            const removed = await this.vocabularyModel.removeBookmark(userId, wordId)

            if (!removed) {
                return res.status(404).json({
                    success: false,
                    error: 'Bookmark not found'
                })
            }

            return res.status(200).json({
                success: true,
                message: 'Bookmark removed',
                wordId
            })
        }
        catch (error) {
            console.error('Remove bookmark error:', error)
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            })
        }
    }
}

module.exports = VocabularyController