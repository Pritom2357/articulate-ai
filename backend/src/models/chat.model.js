const DB_Connection = require('../database/db.js');

class ChatModel {
    constructor() {
        this.db = DB_Connection.getInstance();
    }

    /**
     * Return the most recent session for the user, or create one if none exists.
     * @param {number} userId
     * @returns {Promise<number>} session id
     */
    async getOrCreateSession(userId) {
        const { rows } = await this.db.query_executor(
            `SELECT id FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
            [userId]
        );
        if (rows[0]) {
            // Touch updated_at so the session stays "active"
            await this.db.query_executor(
                `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`,
                [rows[0].id]
            );
            return rows[0].id;
        }
        const { rows: created } = await this.db.query_executor(
            `INSERT INTO chat_sessions (user_id) VALUES ($1) RETURNING id`,
            [userId]
        );
        return created[0].id;
    }

    /**
     * Save a single message to the DB.
     * @param {number} sessionId
     * @param {number} userId
     * @param {'user'|'assistant'} role
     * @param {string|null} content
     * @param {object|null} metadata  e.g. { wordPanel, grammarErrors }
     * @returns {Promise<object>} saved row
     */
    async saveMessage(sessionId, userId, role, content, metadata = null) {
        const { rows } = await this.db.query_executor(
            `INSERT INTO chat_messages (session_id, user_id, role, content, metadata)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [sessionId, userId, role, content, metadata ? JSON.stringify(metadata) : null]
        );
        return rows[0];
    }

    /**
     * Load all messages for a session in chronological order.
     * @param {number} userId
     * @param {number} sessionId
     * @returns {Promise<Array>}
     */
    async getHistory(userId, sessionId) {
        const { rows } = await this.db.query_executor(
            `SELECT id, role, content, metadata, created_at
             FROM chat_messages
             WHERE session_id = $1 AND user_id = $2
             ORDER BY created_at ASC`,
            [sessionId, userId]
        );
        return rows;
    }

    /**
     * List all sessions for a user (newest first).
     */
    async getSessions(userId) {
        const { rows } = await this.db.query_executor(
            `SELECT id, created_at, updated_at FROM chat_sessions
             WHERE user_id = $1 ORDER BY updated_at DESC`,
            [userId]
        );
        return rows;
    }
}

module.exports = ChatModel;
