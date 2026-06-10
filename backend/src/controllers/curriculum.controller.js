const CurriculumModel = require('../models/curriculum.model.js')

class CurriculumController {
    constructor() {
        this.curriculumModel = new CurriculumModel()
    }

    //////// chapters //////////
    getAllChapters = async (req, res) => {
        try {
            const chapters = await this.curriculumModel.getAllChapters()
            if (!chapters) {
                return res.status(404).json({ success: false, error: 'Chapters not found' })
            }

            return res.status(200).json({ success: true, chapters })
        }
        catch (error) {
            console.error('Failed to fetch chapters:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getChapterById = async (req, res) => {
        try {
            const id = parseInt(req.params.id)
            if (!id) {
                return res.status(400).json({ success: false, error: 'Invalid chapter ID' })
            }

            const chapter = await this.curriculumModel.getChapterById(id)
            if (!chapter) {
                return res.status(404).json({ success: false, error: 'Chapter not found' })
            }

            return res.status(200).json({ success: true, chapter })
        }
        catch (error) {
            console.error('Failed to fetch chapter:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    ////// lessons ////////////
    getLessonsByChapterId = async (req, res) => {
        /////// might need for admin ///////
        try {
            const chapterId = parseInt(req.params.chapterId)
            if (!chapterId) {
                return res.status(400).json({ success: false, error: 'Invalid chapter ID' })
            }

            const lessons = await this.curriculumModel.getLessonsByChapterId(chapterId)
            if (!lessons) {
                return res.status(404).json({ success: false, error: 'Lessons not found' })
            }

            return res.status(200).json({ success: true, lessons })
        }
        catch (error) {
            console.error('Failed to fetch lessons by chapter:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getLessonById = async (req, res) => {
        try {
            const id = parseInt(req.params.id)
            if (!id) {
                return res.status(400).json({ success: false, error: 'Invalid lesson ID' })
            }

            const lesson = await this.curriculumModel.getLessonById(id)
            if (!lesson) {
                return res.status(404).json({ success: false, error: 'Lesson not found' })
            }

            return res.status(200).json({ success: true, lesson })
        }
        catch (error) {
            console.error('Failed to fetch lesson:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    ////// words ////////////
    getWordsByLessonId = async (req, res) => {
        try {
            const lessonId = parseInt(req.params.lessonId)
            if (!lessonId) {
                return res.status(400).json({ success: false, error: 'Invalid lesson ID' })
            }

            const words = await this.curriculumModel.getWordsByLessonId(lessonId)
            if (!words) {
                return res.status(404).json({ success: false, error: 'Words not found' })
            }

            return res.status(200).json({ success: true, words })
        }
        catch (error) {
            console.error('Failed to fetch words by lesson:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getWordById = async (req, res) => {
        try {
            const id = parseInt(req.params.id)
            if (!id) {
                return res.status(400).json({ success: false, error: 'Invalid word ID' })
            }

            const word = await this.curriculumModel.getWordById(id)
            if (!word) {
                return res.status(404).json({ success: false, error: 'Word not found' })
            }

            return res.status(200).json({ success: true, word })
        }
        catch (error) {
            console.error('Failed to fetch word:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getWordsByIds = async (req, res) => {
        try {
            const { ids } = req.body
            if (!ids || ids.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid or empty IDs array' })
            }

            const words = await this.curriculumModel.getWordsByIds(ids)
            if (!words) {
                return res.status(404).json({ success: false, error: 'Words not found' })
            }

            return res.status(200).json({ success: true, words })
        }
        catch (error) {
            console.error('Failed to fetch words:', error)
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    getTests = async (req, res) => {
        try {
            const tests = await this.curriculumModel.getTests();
            return res.status(200).json({ success: true, tests });
        } catch (error) {
            console.error('Failed to fetch tests:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    getTestById = async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (!id) {
                return res.status(400).json({ success: false, error: 'Invalid test ID' });
            }
            const testData = await this.curriculumModel.getTestById(id);
            if (!testData) {
                return res.status(404).json({ success: false, error: 'Test not found' });
            }
            return res.status(200).json({ success: true, ...testData });
        } catch (error) {
            console.error('Failed to fetch test details:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

module.exports = CurriculumController