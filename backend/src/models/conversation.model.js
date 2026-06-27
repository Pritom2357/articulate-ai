const DB_Connection = require('../database/db');

class ConversationModel {
  constructor() {
    this.db = DB_Connection.getInstance();
  }

  createSession = async (userId, chapterId, topic) => {
    const result = await this.db.query_executor(
      `INSERT INTO conversation_sessions (user_id, chapter_id, topic)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, chapterId, topic]
    );
    return result.rows[0];
  };

  addTurn = async (sessionId, speaker, transcript, pronScore, fluencyScore, words, phonemes, turnIndex) => {
    const result = await this.db.query_executor(
      `INSERT INTO conversation_turns (session_id, speaker, transcript, pron_score, fluency_score, words, phonemes, turn_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [sessionId, speaker, transcript, pronScore, fluencyScore,
        JSON.stringify(words || []), JSON.stringify(phonemes || []), turnIndex]
    );
    return result.rows[0];
  };

  getSessionWithTurns = async (sessionId, userId) => {
    const sessionResult = await this.db.query_executor(
      `SELECT cs.*, c.title AS chapter_title, c.conversation_key_points
       FROM conversation_sessions cs
       JOIN chapters c ON c.id = cs.chapter_id
       WHERE cs.id = $1 AND cs.user_id = $2`,
      [sessionId, userId]
    );
    const session = sessionResult.rows[0];
    if (!session) return null;

    const turnsResult = await this.db.query_executor(
      `SELECT * FROM conversation_turns WHERE session_id = $1 ORDER BY turn_index ASC`,
      [sessionId]
    );
    return { session, turns: turnsResult.rows };
  };

  getTurnCount = async (sessionId) => {
    const result = await this.db.query_executor(
      `SELECT COUNT(*) AS cnt FROM conversation_turns WHERE session_id = $1`,
      [sessionId]
    );
    return parseInt(result.rows[0]?.cnt || 0, 10);
  };

  endSession = async (sessionId, report) => {
    const result = await this.db.query_executor(
      `UPDATE conversation_sessions
       SET status = 'ENDED', ended_at = NOW(), report = $2
       WHERE id = $1 RETURNING *`,
      [sessionId, JSON.stringify(report)]
    );
    return result.rows[0];
  };

  getChapterTopic = async (chapterId) => {
    const result = await this.db.query_executor(
      `SELECT title, conversation_key_points FROM chapters WHERE id = $1`,
      [chapterId]
    );
    return result.rows[0] || null;
  };
}

module.exports = new ConversationModel();
