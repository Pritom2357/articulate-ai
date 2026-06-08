const DB_connection = require('../database/db.js');

class CurriculumModel {
    constructor() {
        this.db_connection = new DB_connection()
    }


    ////////// chapters /////////////
    getAllChapters = async () => {
        try {
            const query = `
                SELECT
                    id,
                    title,
                    title_bn,
                    order_num,
                    skill_type,
                    description,
                    desc_audio_m,
                    desc_audio_f,
                    (Select Count(*) From lessons Where chapter_id = chapters.id) AS lesson_count
                FROM chapters
                ORDER BY order_num ASC;
            `
            const result = await this.db_connection.query_executor(query)

            return result.rows || null
        } catch (error) {
            throw new Error(`Failed to fetch chapters: ${error.message}`)
        }

    }


    getChapterById = async (chapterId) => {
        try {
            const query = `
                SELECT
                    id,
                    title,
                    title_bn,
                    order_num,
                    skill_type,
                    description,
                    desc_audio_m,
                    desc_audio_f,
                    (Select Count(*) From lessons Where chapter_id = chapters.id) AS lesson_count
                FROM chapters
                WHERE id = $1
                ORDER BY order_num ASC;
            `

            const result1 = await this.db_connection.query_executor(query, [chapterId])

            const chapter = result1.rows[0] || null
            if (!chapter) return null

            const result2 = await this.getLessonsByChapterId(chapterId)

            return { chapter, lessons: result2 }
        } catch (error) {
            throw new Error(`Failed to fetch chapter: ${error.message}`)
        }
    }


    ////////// lessons /////////////
    getLessonsByChapterId = async (chapterId) => {
        try {
            const query = `
                SELECT
                    id,
                    title,
                    title_bn,
                    order_num,
                    type,
                    objective_bn
                FROM lessons
                WHERE chapter_id = $1
                ORDER BY order_num ASC;
            `

            const params = [chapterId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows || null
        } catch (error) {
            throw new Error(`Failed to fetch lessons: ${error.message}`)
        }
    }


    getLessonById = async (id) => {
        try {
            const query = `
                SELECT
                    id,
                    title,
                    title_bn,
                    order_num,
                    type,
                    objective_bn
                FROM lessons
                WHERE id = $1
                ORDER BY order_num ASC;
            `

            const result1 = await this.db_connection.query_executor(query, [id])

            const lesson = result1.rows[0] || null
            if (!lesson) return null

            const result2 = await this.getWordsByLessonId(id)

            return { lesson, words: result2 }
        } catch (error) {
            throw new Error(`Failed to fetch lesson: ${error.message}`)
        }
    }


    ////////// words /////////////
    getWordsByLessonId = async (lessonId) => {
        try {
            const query = `
                SELECT
                    w.id,
                    w.word,
                    w.bangla_meaning,
                    w.frequency_rank,
                    w.difficulty_level,
                    w.ipa,
                    w.syllables,
                    w.audio_url
                FROM words w
                JOIN lesson_words lw ON lw.word_id = w.id
                WHERE lw.lesson_id = $1
                ORDER BY w.frequency_rank ASC, w.word ASC;
            `

            const params = [lessonId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows || null
        } catch (error) {
            throw new Error(`Failed to fetch words: ${error.message}`)
        }
    }


    getWordById = async (id) => {
        try {
            const query = `
                SELECT
                    id,
                    word,
                    bangla_meaning,
                    frequency_rank,
                    difficulty_level,
                    ipa,
                    syllables,
                    audio_url
                FROM words
                WHERE id = $1;
            `

            const params = [id]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Failed to fetch word: ${error.message}`)
        }
    }


    getWordsByIds = async (ids) => {
        // a list of IDs
        try {
            if (!ids || ids.length === 0) return []

            const query = `
                SELECT
                    id,
                    word,
                    bangla_meaning,
                    frequency_rank,
                    difficulty_level,
                    ipa,
                    syllables,
                    audio_url
                FROM words
                WHERE id = ANY($1)
                ORDER BY frequency_rank ASC, word ASC;
            `

            const params = [ids]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows || null
        } catch (error) {
            throw new Error(`Failed to fetch words: ${error.message}`)
        }
    }
}

module.exports = CurriculumModel