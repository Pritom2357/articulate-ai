/**
 * One-off migration: adds the two tables backing phoneme-level pronunciation scoring.
 * Deliberately has NO foreign key to tests/test_progress — the old pronunciation_attempts
 * table was tied to a test/test_progress row, which broke once the curriculum was rebuilt
 * as pure vocabulary lessons (tests table is now empty). These tables key off word_id only.
 *
 * Usage: node addPhonemeTables.js
 */
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_phoneme_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phoneme VARCHAR(10) NOT NULL,
        score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
        word_id INTEGER REFERENCES words(id) ON DELETE SET NULL,
        recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_phoneme_summary (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phoneme VARCHAR(10) NOT NULL,
        avg_score FLOAT NOT NULL DEFAULT 0,
        total_attempts INTEGER NOT NULL DEFAULT 0,
        fail_streak INTEGER NOT NULL DEFAULT 0,
        mastered BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (user_id, phoneme)
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_phoneme_scores_user ON user_phoneme_scores(user_id);`);

    console.log('✅ user_phoneme_scores and user_phoneme_summary ready');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
