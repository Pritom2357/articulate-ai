/**
 * One-time migration: create chat_sessions and chat_messages tables.
 * Run: node src/database/migrateChatHistory.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const DB_Connection = require('./db.js');

const db = DB_Connection.getInstance();

async function migrate() {
  console.log('Running chat history migration...');

  await db.query_executor(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ chat_sessions table ready');

  await db.query_executor(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          SERIAL PRIMARY KEY,
      session_id  INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
      content     TEXT,
      metadata    JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ chat_messages table ready');

  await db.query_executor(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session
    ON chat_messages (session_id, created_at)
  `);
  console.log('✅ index on chat_messages ready');

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
