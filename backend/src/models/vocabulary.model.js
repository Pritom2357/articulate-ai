const DB_Connection = require('../database/db.js')

class VocabularyModel {
    constructor() {
        this.db_connection = new DB_Connection()
    }

    getUserVocabulary = async (userId, filter = 'all') => {
        try {
            const results = {}
            let familiarity = ''

            switch (filter) {
                case 'all':
                    familiarity = `%`
                    break
                case 'new':
                    familiarity = `NEW`
                    break
                case 'learning':
                    familiarity = `LEARNING`
                    break
                case 'familiar':
                    familiarity = `FAMILIAR`
                    break
                case 'mastered':
                    familiarity = `MASTERED`
                    break
                default:
                    familiarity = `%`
            }

            const whereClause = filter === 'all' ? '' : `AND familiarity LIKE '${familiarity}'`

            const query = `
                SELECT * FROM vw_user_words
                WHERE
                    user_id = $1
                    ${whereClause}
                ORDER BY
                    CASE familiarity
                        WHEN 'NEW'      THEN 1
                        WHEN 'LEARNING' THEN 2
                        WHEN 'FAMILIAR' THEN 3
                        WHEN 'MASTERED' THEN 4
                    END,
                    word ASC;
            `

            const result = await this.db_connection.query_executor(query, [userId])

            return result.rows || null
        }
        catch (error) {
            throw new Error(`Failed to fetch vocabulary: ${error.message}`)
        }
    }


    getBookmarks = async (userId) => {
        try {
            const query = `
                SELECT
                    wb.word_id,
                    w.word,
                    w.bangla_meaning,
                    w.ipa,
                    w.syllables,
                    w.audio_url,
                    wb.saved_at,
                    w.difficulty_level,
                    COALESCE(uwp.familiarity, 'NEW') AS familiarity,
                    COALESCE(uwp.correct_count, 0) AS correct_count,
                    COALESCE(uwp.wrong_count, 0) AS wrong_count
                FROM word_bookmarks wb
                JOIN words w ON w.id = wb.word_id
                LEFT JOIN user_word_progress uwp
                    ON uwp.word_id = wb.word_id AND uwp.user_id = wb.user_id
                WHERE wb.user_id = $1
                ORDER BY wb.saved_at DESC;
            `

            const result = await this.db_connection.query_executor(query, [userId])

            return result.rows || null
        }
        catch (error) {
            throw new Error(`Failed to fetch bookmarks: ${error.message}`)
        }
    }


    addBookmark = async (userId, wordId) => {
        try {
            const query = `
                INSERT INTO word_bookmarks (user_id, word_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                RETURNING *;
            `

            const params = [userId, wordId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        }
        catch (error) {
            throw new Error(`Failed to add bookmark: ${error.message}`)
        }
    }


    removeBookmark = async (userId, wordId) => {
        try {
            const query = `
                DELETE FROM word_bookmarks
                WHERE user_id = $1 AND word_id = $2
                RETURNING word_id;
            `

            const params = [userId, wordId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        }
        catch (error) {
            throw new Error(`Failed to remove bookmark: ${error.message}`)
        }
    }
}

module.exports = VocabularyModel