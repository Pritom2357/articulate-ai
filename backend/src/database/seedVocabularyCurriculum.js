/**
 * Rebuilds the curriculum from scratch as a pure vocabulary progression:
 *   8 chapters (CEFR A1 -> C1) x 5 lessons x 10-12 words each.
 *
 * Word difficulty pipeline:
 *   1. Add words.cefr_level (A1..C2) if missing.
 *   2. Tag words against the Oxford 3000 list (data-source/oxford3000_cefr.csv) — these are
 *      the most pedagogically-vetted "most important words" for each level.
 *   3. For every word the Oxford list doesn't cover, derive cefr_level from the existing
 *      Zipf-based difficulty_level + frequency_rank:
 *        BEGINNER     -> split in half (by frequency) into A1 / A2
 *        INTERMEDIATE -> split in thirds (by frequency) into B1 / B2 / C1
 *      (There are zero ADVANCED-tagged words in this DB, so C1 is carved out of the
 *      least-frequent third of INTERMEDIATE instead.)
 *   4. Wipe the existing chapters (cascades lessons/lesson_words/tests/etc — already
 *      enforced by FK ON DELETE CASCADE in the schema).
 *   5. For each CEFR level, pull the N most frequent words tagged at that level
 *      (Oxford-tagged words naturally float to the top since they're common words),
 *      and lay them out across chapters -> lessons in frequency order, so difficulty
 *      increases smoothly both across chapters and within each chapter.
 *
 * Usage: node seedVocabularyCurriculum.js
 */
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const WORDS_PER_LESSON = 11; // within the requested 10-12 range
const LESSONS_PER_CHAPTER = 5;

// level -> how many chapters worth of words it needs
const LEVEL_PLAN = [
  { level: 'A1', chapters: 2 },
  { level: 'A2', chapters: 2 },
  { level: 'B1', chapters: 2 },
  { level: 'B2', chapters: 1 },
  { level: 'C1', chapters: 1 },
];

const CHAPTER_META = {
  A1: { title: 'Foundations', title_bn: 'ভিত্তি', desc: 'The most essential, highest-frequency words every absolute beginner needs first.' },
  A2: { title: 'Everyday Life', title_bn: 'দৈনন্দিন জীবন', desc: 'Common words for daily routines, people, places, and simple descriptions.' },
  B1: { title: 'Growing Fluency', title_bn: 'সাবলীলতার অগ্রগতি', desc: 'Words that let you express opinions, plans, and more complex everyday ideas.' },
  B2: { title: 'Confident Communication', title_bn: 'আত্মবিশ্বাসী যোগাযোগ', desc: 'Vocabulary for nuanced discussion, debate, and abstract topics.' },
  C1: { title: 'Advanced Mastery', title_bn: 'উচ্চতর দক্ষতা', desc: 'Precise, less-common vocabulary for advanced, fluent communication.' },
};

async function addCefrColumn() {
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'words' AND column_name = 'cefr_level'
      ) THEN
        ALTER TABLE words ADD COLUMN cefr_level VARCHAR(2)
          CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2'));
      END IF;
    END $$;
  `);
  console.log('✅ words.cefr_level column ready');
}

async function tagFromOxfordList() {
  const csvPath = path.resolve(__dirname, '../../../data-source/oxford3000_cefr.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').trim().split(/\r?\n/).slice(1);
  const entries = lines
    .map(l => l.split(',').map(s => s.trim()))
    .filter(([w, lvl]) => w && lvl);

  let matched = 0;
  for (const [word, level] of entries) {
    const res = await pool.query('UPDATE words SET cefr_level = $1 WHERE word = $2', [level, word]);
    if (res.rowCount > 0) matched++;
  }
  console.log(`✅ Tagged ${matched}/${entries.length} words from Oxford 3000 list`);
}

async function tagFallback() {
  // BEGINNER -> A1/A2 (halves), INTERMEDIATE -> B1/B2/C1 (thirds), by frequency_rank
  await pool.query(`
    WITH ranked AS (
      SELECT id, difficulty_level,
        CASE
          WHEN difficulty_level = 'BEGINNER' THEN NTILE(2) OVER (PARTITION BY difficulty_level ORDER BY frequency_rank ASC)
          WHEN difficulty_level = 'INTERMEDIATE' THEN NTILE(3) OVER (PARTITION BY difficulty_level ORDER BY frequency_rank ASC)
        END AS bucket
      FROM words
      WHERE cefr_level IS NULL
    )
    UPDATE words w
    SET cefr_level = CASE
      WHEN r.difficulty_level = 'BEGINNER' AND r.bucket = 1 THEN 'A1'
      WHEN r.difficulty_level = 'BEGINNER' AND r.bucket = 2 THEN 'A2'
      WHEN r.difficulty_level = 'INTERMEDIATE' AND r.bucket = 1 THEN 'B1'
      WHEN r.difficulty_level = 'INTERMEDIATE' AND r.bucket = 2 THEN 'B2'
      WHEN r.difficulty_level = 'INTERMEDIATE' AND r.bucket = 3 THEN 'C1'
    END
    FROM ranked r
    WHERE w.id = r.id;
  `);
  const counts = await pool.query('SELECT cefr_level, COUNT(*) FROM words GROUP BY cefr_level ORDER BY cefr_level');
  console.log('✅ Fallback tagging complete. Full cefr_level distribution:');
  console.table(counts.rows);
}

async function wipeCurriculum() {
  await pool.query('DELETE FROM chapters'); // cascades lessons, lesson_words, lesson_phrases, tests, test_questions, test_progress, test_attempts, pronunciation_attempts, user_lesson_progress
  await pool.query('UPDATE user_progress SET placement_chapter = 1');
  console.log('✅ Wiped existing chapters/lessons/tests (cascaded) and reset placement_chapter');
}

async function buildCurriculum() {
  let chapterOrder = 1;
  let totalLessons = 0;
  let totalWordLinks = 0;

  for (const { level, chapters } of LEVEL_PLAN) {
    const wordsNeeded = chapters * LESSONS_PER_CHAPTER * WORDS_PER_LESSON;
    const { rows: pool_words } = await pool.query(
      'SELECT id, word, frequency_rank FROM words WHERE cefr_level = $1 ORDER BY frequency_rank ASC LIMIT $2',
      [level, wordsNeeded]
    );
    console.log(`${level}: needed ${wordsNeeded}, found ${pool_words.length}`);
    if (pool_words.length < wordsNeeded) {
      console.warn(`⚠️  ${level} is short by ${wordsNeeded - pool_words.length} words — later lessons at this level will have fewer words.`);
    }

    const meta = CHAPTER_META[level];
    const perChapter = LESSONS_PER_CHAPTER * WORDS_PER_LESSON;

    for (let c = 0; c < chapters; c++) {
      const part = chapters > 1 ? ` ${['I', 'II', 'III'][c]}` : '';
      const chapterWords = pool_words.slice(c * perChapter, (c + 1) * perChapter);
      if (chapterWords.length === 0) continue;

      const { rows: [chapterRow] } = await pool.query(
        `INSERT INTO chapters (title, title_bn, order_num, skill_type, description, conversation_key_points)
         VALUES ($1, $2, $3, 'MIXED', $4, '[]') RETURNING id`,
        [
          `${meta.title}${part} (${level})`,
          `${meta.title_bn}${part} (${level})`,
          chapterOrder,
          meta.desc,
        ]
      );
      const chapterId = chapterRow.id;
      chapterOrder++;

      for (let l = 0; l < LESSONS_PER_CHAPTER; l++) {
        const lessonWords = chapterWords.slice(l * WORDS_PER_LESSON, (l + 1) * WORDS_PER_LESSON);
        if (lessonWords.length === 0) continue;

        const { rows: [lessonRow] } = await pool.query(
          `INSERT INTO lessons (chapter_id, title, title_bn, order_num, type, objective_bn)
           VALUES ($1, $2, $3, $4, 'LEARN', $5) RETURNING id`,
          [
            chapterId,
            `Vocabulary ${l + 1}`,
            `শব্দভান্ডার ${l + 1}`,
            l + 1,
            `এই লেসনে ${lessonWords.length}টি গুরুত্বপূর্ণ ${level} স্তরের শব্দ শিখবেন।`,
          ]
        );
        const lessonId = lessonRow.id;
        totalLessons++;

        for (const w of lessonWords) {
          await pool.query(
            'INSERT INTO lesson_words (word_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [w.id, lessonId]
          );
          totalWordLinks++;
        }
      }
    }
  }

  console.log(`✅ Built ${chapterOrder - 1} chapters, ${totalLessons} lessons, ${totalWordLinks} word links`);
}

async function run() {
  try {
    await addCefrColumn();
    await tagFromOxfordList();
    await tagFallback();
    await wipeCurriculum();
    await buildCurriculum();
    console.log('🚀 Vocabulary curriculum rebuild complete!');
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
