/**
 * One-time routine to verify and fix word data using OpenAI.
 * Checks: word casing, bangla_meaning (must be Bengali script), ipa, syllables.
 *
 * Usage:
 *   node src/database/fixWordData.js            # live run
 *   node src/database/fixWordData.js --dry-run  # preview changes only
 *
 * Progress is saved to .fixwords_progress.json so the script can resume
 * if interrupted. Delete that file to start over.
 *
 * After a successful full run, delete this file.
 */

const { Pool }  = require('pg');
const OpenAI    = require('openai');
const path      = require('path');
const fs        = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN      = process.argv.includes('--dry-run');
const BATCH_SIZE   = 25;           // words per OpenAI call
const MODEL        = 'gpt-4o-mini';
const DELAY_MS     = 1200;         // ms between batches (stay under rate limit)
const MAX_RETRIES  = 4;
const PROGRESS_FILE = path.resolve(__dirname, '.fixwords_progress.json');

// ─── DB & OpenAI clients ──────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Progress helpers ─────────────────────────────────────────────────────────

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (_) {}
  return { lastProcessedId: 0, fixed: 0, skipped: 0, errors: 0 };
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

// ─── Sleep / retry helpers ────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
      const wait = Math.min(1000 * 2 ** attempt, 30_000);
      console.warn(`  ⚠️  ${label} — attempt ${attempt} failed: ${err.message}${isLast ? ' (giving up)' : `. Retry in ${wait / 1000}s…`}`);
      if (isLast) throw err;
      await sleep(wait);
    }
  }
}

// ─── OpenAI call ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a linguistics and Bengali-language expert helping maintain a spoken English learning platform for Bangla-speaking users in Bangladesh.

You will receive a JSON array of English vocabulary entries. For each entry verify and correct these four fields:

1. word — A single English word. Keep it lowercase unless it is a proper noun or the pronoun "I". Fix broken or inconsistent casing.
2. bangla_meaning — MUST be written entirely in Bengali (বাংলা) Unicode script. Absolutely no English words or Roman letters. Give the most natural, everyday Bangla meaning a learner in Bangladesh would instantly understand. If the current value is in English, transliteration, or wrong, replace it with proper Bangla script.
3. ipa — Correct IPA (International Phonetic Alphabet) transcription in American English, enclosed in /slashes/ (e.g. /ˈwɔːtər/). Fix if empty or incorrect for the given word.
4. syllables — Correct syllabification using hyphens (e.g. "wa-ter", "com-put-er"). Fix if empty or incorrect.

Rules:
- Return a JSON object: { "corrections": [ ... ] }
- Each item in the array MUST have the "id" field.
- Only include fields that need to be changed. If a field is already correct, omit it.
- If an entry needs no changes at all, still include it with just its id (e.g. { "id": 5 }).
- Never add extra fields or explanations.`;

async function callOpenAI(batch) {
  const input = batch.map((w) => ({
    id:             w.id,
    word:           w.word,
    bangla_meaning: w.bangla_meaning,
    ipa:            w.ipa    ?? '',
    syllables:      w.syllables ?? '',
  }));

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: JSON.stringify(input) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const raw = response.choices[0].message.content;
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.corrections)) {
    throw new Error(`Unexpected response shape: ${raw.slice(0, 200)}`);
  }

  return parsed.corrections;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function fetchBatch(afterId, limit) {
  const { rows } = await pool.query(
    `SELECT id, word, bangla_meaning, ipa, syllables
     FROM words
     WHERE id > $1
     ORDER BY id
     LIMIT $2`,
    [afterId, limit],
  );
  return rows;
}

async function applyCorrections(corrections, originalMap) {
  let updated = 0;

  for (const fix of corrections) {
    const original = originalMap.get(fix.id);
    if (!original) continue;

    // Build only the fields that actually changed
    const changes = {};
    if (fix.word           !== undefined && fix.word           !== original.word)           changes.word           = fix.word;
    if (fix.bangla_meaning !== undefined && fix.bangla_meaning !== original.bangla_meaning) changes.bangla_meaning = fix.bangla_meaning;
    if (fix.ipa            !== undefined && fix.ipa            !== original.ipa)             changes.ipa            = fix.ipa;
    if (fix.syllables      !== undefined && fix.syllables      !== original.syllables)       changes.syllables      = fix.syllables;

    if (Object.keys(changes).length === 0) continue;

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] id=${fix.id} "${original.word}":`);
      for (const [k, v] of Object.entries(changes)) {
        console.log(`    ${k}: "${original[k]}"  →  "${v}"`);
      }
      updated++;
      continue;
    }

    // If the word field itself is being renamed, check the target doesn't already exist
    if (changes.word) {
      const { rows } = await pool.query(
        'SELECT id FROM words WHERE word = $1 AND id <> $2',
        [changes.word, fix.id],
      );
      if (rows.length > 0) {
        // Target word already exists — skip the word field, keep other fixes
        console.log(`  ⚠️  Skipping word rename id=${fix.id} "${original.word}" → "${changes.word}" (duplicate)`);
        delete changes.word;
        if (Object.keys(changes).length === 0) continue;
      }
    }

    // Build parameterised UPDATE
    const keys   = Object.keys(changes);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = [...keys.map((k) => changes[k]), fix.id];

    try {
      await pool.query(
        `UPDATE words SET ${setClauses} WHERE id = $${keys.length + 1}`,
        values,
      );
      updated++;
    } catch (err) {
      // 23505 = unique_violation — another row already has this word value
      if (err.code === '23505') {
        console.log(`  ⚠️  Unique conflict on id=${fix.id} "${original.word}" — skipping row`);
      } else {
        throw err;
      }
    }
  }

  return updated;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌  OPENAI_API_KEY is not set in .env');
    process.exit(1);
  }

  if (DRY_RUN) console.log('🔍  DRY-RUN mode — no database writes.\n');

  const progress = loadProgress();
  console.log(`▶  Starting from id > ${progress.lastProcessedId}  (fixed so far: ${progress.fixed})\n`);

  // Get total count for progress display
  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM words WHERE id > $1', [progress.lastProcessedId]);
  const total = parseInt(count, 10);
  const batches = Math.ceil(total / BATCH_SIZE);
  console.log(`📚  ${total} words remaining across ~${batches} batches (batch size ${BATCH_SIZE})\n`);

  let batchNum = 0;

  while (true) {
    const words = await fetchBatch(progress.lastProcessedId, BATCH_SIZE);
    if (words.length === 0) break;

    batchNum++;
    const lo = words[0].id;
    const hi = words[words.length - 1].id;
    process.stdout.write(`Batch ${batchNum}/${batches}  ids ${lo}–${hi} … `);

    const originalMap = new Map(words.map((w) => [w.id, w]));

    let corrections;
    try {
      corrections = await withRetry(() => callOpenAI(words), `batch ${batchNum}`);
    } catch (err) {
      console.error(`\n  ❌  Skipping batch (${words.length} words): ${err.message}`);
      progress.errors += words.length;
      progress.lastProcessedId = hi;
      saveProgress(progress);
      await sleep(DELAY_MS);
      continue;
    }

    const updated = await applyCorrections(corrections, originalMap);

    progress.fixed             += updated;
    progress.skipped           += words.length - updated;
    progress.lastProcessedId    = hi;
    saveProgress(progress);

    console.log(`✅  ${updated} fixed, ${words.length - updated} unchanged`);

    await sleep(DELAY_MS);
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅  Done!  fixed=${progress.fixed}  unchanged=${progress.skipped}  errors=${progress.errors}`);
  if (DRY_RUN) console.log('   (No writes were made — re-run without --dry-run to apply.)');

  if (!DRY_RUN && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log('🗑   Progress file deleted.');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
