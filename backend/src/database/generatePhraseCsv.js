/**
 * Generates a review-able CSV of contextual phrases/short sentences for every lesson, using
 * the lesson's own taught words so practice phrases reinforce what was just learned instead of
 * being generic. Mirrors the existing "generate CSV first, review, then import" pattern used for
 * the Oxford 3000 word list (data-source/oxford3000_cefr.csv) — this script only writes a CSV,
 * it does NOT touch the `phrases`/`lesson_phrases` tables.
 *
 * Usage: node generatePhraseCsv.js [phrasesPerLesson]
 */
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PHRASES_PER_LESSON = parseInt(process.argv[2]) || 4;
const MODEL = 'gpt-4o-mini';
const OUTPUT_CSV = path.resolve(__dirname, '../../../data-source/lesson_phrases.csv');

async function getLessonsWithWords() {
  const { rows: lessons } = await pool.query(`
    SELECT l.id AS lesson_id, l.title AS lesson_title, c.title AS chapter_title, c.order_num AS chapter_order
    FROM lessons l
    JOIN chapters c ON c.id = l.chapter_id
    ORDER BY c.order_num, l.order_num
  `);

  for (const lesson of lessons) {
    const { rows: words } = await pool.query(`
      SELECT w.word, w.cefr_level
      FROM lesson_words lw
      JOIN words w ON w.id = lw.word_id
      WHERE lw.lesson_id = $1
      ORDER BY w.frequency_rank
    `, [lesson.lesson_id]);
    lesson.words = words.map(w => w.word);
    lesson.cefr_level = words[0]?.cefr_level || 'A1';
  }

  return lessons;
}

async function generatePhrasesForLesson(lesson) {
  const prompt = `You are writing short English practice phrases/sentences for a Bengali-speaking English learner at CEFR level ${lesson.cefr_level}.

Lesson words to practice: ${lesson.words.join(', ')}

Write exactly ${PHRASES_PER_LESSON} short phrases or sentences (a few words to one short sentence each) that:
- Use as many of the lesson words above as naturally fits — it's fine to add a few extra simple connecting words (especially for function-word-only lessons), but stay at or below CEFR ${lesson.cefr_level} complexity.
- Sound natural, like something a real person would say, not a forced word-stuffing exercise.
- Are varied from each other (different sentence shapes/topics), not repeats of the same structure.
- Each must be unique across the whole curriculum, not just this lesson.

For each phrase, also give a natural (not overly literal) Bangla meaning, and list which lesson words it actually used.

Return ONLY a JSON object of the form:
{"phrases": [{"phrase_en": "...", "phrase_bn": "...", "words_used": ["..."]}]}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return parsed.phrases || [];
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log(`Generating ~${PHRASES_PER_LESSON} phrases/lesson using ${MODEL}...`);
  const lessons = await getLessonsWithWords();
  console.log(`Found ${lessons.length} lessons.`);

  const csvRows = ['lesson_id,chapter_title,lesson_title,cefr_level,words_used,phrase_en,phrase_bn'];
  let successCount = 0;
  let failCount = 0;

  for (const lesson of lessons) {
    try {
      console.log(`[lesson ${lesson.lesson_id}] "${lesson.chapter_title} / ${lesson.lesson_title}" (${lesson.cefr_level}), words: ${lesson.words.join(', ')}`);
      const phrases = await generatePhrasesForLesson(lesson);
      console.log(`  -> got ${phrases.length} phrases`);

      for (const p of phrases) {
        csvRows.push([
          lesson.lesson_id,
          csvEscape(lesson.chapter_title),
          csvEscape(lesson.lesson_title),
          lesson.cefr_level,
          csvEscape((p.words_used || []).join('; ')),
          csvEscape(p.phrase_en),
          csvEscape(p.phrase_bn)
        ].join(','));
      }
      successCount++;
    } catch (err) {
      console.error(`  !! FAILED for lesson ${lesson.lesson_id}: ${err.message}`);
      failCount++;
    }
  }

  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n'), 'utf-8');
  console.log(`\nDone. ${successCount} lessons succeeded, ${failCount} failed.`);
  console.log(`Wrote ${csvRows.length - 1} phrase rows to ${OUTPUT_CSV}`);
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
