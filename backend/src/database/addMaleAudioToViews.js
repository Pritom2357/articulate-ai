const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await pool.query(`
    CREATE OR REPLACE VIEW vw_due_cards AS
    SELECT
      uwp.user_id,
      uwp.id AS progress_id,
      uwp.word_id,
      w.word,
      w.bangla_meaning,
      w.ipa,
      w.syllables,
      w.audio_url,
      uwp.familiarity,
      uwp.streak,
      uwp.correct_count,
      uwp.wrong_count,
      uwp.easiness,
      uwp.interval_days,
      uwp.next_review,
      w.frequency_rank,
      w.difficulty_level,
      w.audio_url_m
    FROM user_word_progress uwp
    JOIN words w ON w.id = uwp.word_id
    WHERE uwp.next_review <= CURRENT_DATE;
  `);
  console.log('✅  vw_due_cards updated');

  await pool.query(`
    CREATE OR REPLACE VIEW vw_user_words AS
    SELECT
      uwp.id,
      uwp.user_id,
      uwp.word_id,
      w.word,
      w.bangla_meaning,
      w.ipa,
      w.syllables,
      w.audio_url,
      w.difficulty_level,
      w.frequency_rank,
      uwp.familiarity,
      uwp.correct_count,
      uwp.wrong_count,
      uwp.streak,
      uwp.next_review,
      uwp.last_reviewed,
      EXISTS (
        SELECT 1 FROM word_bookmarks wb
        WHERE wb.user_id = uwp.user_id AND wb.word_id = uwp.word_id
      ) AS is_bookmarked,
      w.audio_url_m
    FROM user_word_progress uwp
    JOIN words w ON w.id = uwp.word_id
    ORDER BY w.word ASC;
  `);
  console.log('✅  vw_user_words updated');

  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
