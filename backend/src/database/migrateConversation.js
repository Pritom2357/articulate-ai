/**
 * One-time migration: create conversation_sessions and conversation_turns tables.
 * Run: node src/database/migrateConversation.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const DB_Connection = require('./db.js');

const db = DB_Connection.getInstance();

async function migrate() {
  console.log('Running conversation tables migration...');

  await db.query_executor(`
    CREATE TABLE IF NOT EXISTS conversation_sessions (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chapter_id  INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      topic       TEXT NOT NULL,
      status      VARCHAR(6) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'ENDED')),
      report      JSONB,
      started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at    TIMESTAMPTZ
    )
  `);
  console.log('✅ conversation_sessions table ready');

  await db.query_executor(`
    CREATE TABLE IF NOT EXISTS conversation_turns (
      id            SERIAL PRIMARY KEY,
      session_id    INTEGER NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
      speaker       VARCHAR(4) NOT NULL CHECK(speaker IN ('user', 'ai')),
      transcript    TEXT,
      pron_score    INTEGER,
      fluency_score INTEGER,
      words         JSONB,
      phonemes      JSONB,
      turn_index    INTEGER NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ conversation_turns table ready');

  await db.query_executor(`
    CREATE INDEX IF NOT EXISTS idx_conv_turns_session
    ON conversation_turns(session_id, turn_index)
  `);
  console.log('✅ index on conversation_turns ready');

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
