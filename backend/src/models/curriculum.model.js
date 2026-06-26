const DB_connection = require('../database/db.js');

class CurriculumModel {
    constructor() {
        this.db_connection = new DB_connection()
    }


    ////////// chapters /////////////
    getAllChapters = async () => {
        try {
            const query = `
                SELECT * from vw_chapters
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
                SELECT * from vw_chapters
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

            // Fetch linked phrases for the lesson
            const phraseQuery = `
                SELECT p.id, p.phrase_en, p.phrase_bn, p.difficulty, p.audio_url
                FROM phrases p
                JOIN lesson_phrases lp ON lp.phrase_id = p.id
                WHERE lp.lesson_id = $1
                ORDER BY p.id ASC;
            `;
            const result3 = await this.db_connection.query_executor(phraseQuery, [id]);

            return { lesson, words: result2, phrases: result3.rows || [] }
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
                    w.audio_url,
                    w.audio_url_m
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
                    audio_url,
                    audio_url_m
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
                    audio_url,
                    audio_url_m
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


    // tests
    getTests = async () => {
        try {
            const query = `
                SELECT t.*, l.title as lesson_title, c.title as chapter_title, c.title_bn as chapter_title_bn
                FROM tests t
                LEFT JOIN lessons l ON t.lesson_id = l.id
                LEFT JOIN chapters c ON l.chapter_id = c.id
                ORDER BY t.id ASC;
            `;
            const result = await this.db_connection.query_executor(query);
            return result.rows || [];
        } catch (error) {
            throw new Error(`Failed to fetch tests: ${error.message}`);
        }
    }

    getTestById = async (id) => {
        try {
            const query = `
                SELECT t.*, l.title as lesson_title
                FROM tests t
                LEFT JOIN lessons l ON t.lesson_id = l.id
                WHERE t.id = $1;
            `;
            const testResult = await this.db_connection.query_executor(query, [id]);
            const test = testResult.rows[0] || null;
            if (!test) return null;

            const questionsQuery = `
                SELECT * FROM test_questions
                WHERE test_id = $1
                ORDER BY order_num ASC;
            `;
            const questionsResult = await this.db_connection.query_executor(questionsQuery, [id]);

            return { test, questions: questionsResult.rows || [] };
        } catch (error) {
            throw new Error(`Failed to fetch test details: ${error.message}`);
        }
    }


    // global search
    search = async (keyWord, type = 'all') => {
        try {
            const term = `%${keyWord}%`
            const results = {}

            if (type === 'all' || type === 'words') {
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
                    WHERE
                        word ILIKE $1
                        OR bangla_meaning ILIKE $1
                    ORDER BY word ASC;
                `

                const result1 = await this.db_connection.query_executor(query, [term])
                results.words = result1.rows || []
            }

            if (type === 'all' || type === 'phrases') {
                const query = `
                    SELECT
                        id,
                        phrase_en,
                        phrase_bn,
                        audio_url,
                        difficulty
                    FROM phrases
                    WHERE
                        phrase_en ILIKE $1
                        OR phrase_bn ILIKE $1
                    ORDER BY id ASC;
                `

                const result2 = await this.db_connection.query_executor(query, [term])
                results.phrases = result2.rows || []
            }

            if (type === 'all' || type === 'lessons') {
                const query = `
                    SELECT
                        l.id,
                        l.title,
                        l.title_bn,
                        l.type,
                        l.objective_bn,
                        c.id AS chapter_id,
                        c.title AS chapter_title
                    FROM lessons l
                    JOIN chapters c ON c.id = l.chapter_id
                    WHERE l.title ILIKE $1
                        OR l.title_bn ILIKE $1
                        OR l.objective_bn ILIKE $1
                        OR c.title ILIKE $1
                        OR c.title_bn ILIKE $1
                    ORDER BY l.id ASC;
                `

                const result3 = await this.db_connection.query_executor(query, [term])
                results.lessons = result3.rows || []
            }

            return results
        } catch (error) {
            throw new Error(`Search failed: ${error.message}`)
        }
    }
}

module.exports = CurriculumModel