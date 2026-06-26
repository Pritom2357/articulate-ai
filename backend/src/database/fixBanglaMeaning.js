/**
 * One-time routine to audit and fix bangla_meaning in the words table.
 * Fetches every word + its current bangla_meaning, sends batches to OpenAI,
 * and writes corrected Bengali meanings back.
 *
 * Common problems it catches:
 *   - English words used as meaning  (e.g. "in" → "ভেতরে / মধ্যে")
 *   - Transliteration in brackets    (e.g. "[In]", "[aɪ]")
 *   - Single wrong characters        (e.g. "ক" for the article "a")
 *   - Empty or NULL meanings
 *   - Roman-script or mixed-script entries
 *
 * Usage:
 *   node src/database/fixBanglaMeaning.js            # live run
 *   node src/database/fixBanglaMeaning.js --dry-run  # preview only
 *
 * Progress is saved to .fixbangla_progress.json so the run can resume
 * if interrupted. Delete that file to start from scratch.
 */

const { Pool } = require('pg');
const OpenAI   = require('openai');
const path     = require('path');
const fs       = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN       = process.argv.includes('--dry-run');
const BATCH_SIZE    = 40;
const MODEL         = 'gpt-4o-mini';
const DELAY_MS      = 1000;
const MAX_RETRIES   = 4;
const PROGRESS_FILE = path.resolve(__dirname, '.fixbangla_progress.json');

// ─── Clients ──────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Progress helpers ─────────────────────────────────────────────────────────

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE))
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch (_) {}
  return { lastProcessedId: 0, fixed: 0, skipped: 0, errors: 0 };
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try { return await fn(); }
    catch (err) {
      const isLast = attempt === MAX_RETRIES;
      const wait   = Math.min(1000 * 2 ** attempt, 30_000);
      console.warn(`  ⚠  ${label} — attempt ${attempt}: ${err.message}${isLast ? ' (giving up)' : `. Retry in ${wait / 1000}s…`}`);
      if (isLast) throw err;
      await sleep(wait);
    }
  }
}

// ─── Detection: is this meaning clearly wrong? ────────────────────────────────
// We send ALL words to OpenAI regardless, but we log a warning for entries
// that are obviously broken so we know the scale of the problem.

function looksWrong(word, meaning) {
  if (!meaning || meaning.trim() === '') return true;

  // Contains any ASCII letter (a-z A-Z) — should be pure Bengali
  if (/[a-zA-Z]/.test(meaning)) return true;

  // Meaning is identical to the English word (case-insensitive)
  if (meaning.trim().toLowerCase() === word.trim().toLowerCase()) return true;

  // Bracket-wrapped content like [In] or [aɪ]
  if (/^\[.*\]$/.test(meaning.trim())) return true;

  return false;
}

// ─── OpenAI call ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Bengali linguistics expert maintaining a vocabulary database for an English-learning app used by Bangladeshi students.

You will receive a JSON array of English vocabulary entries, each with an "id", "word", and "bangla_meaning".

Your job: return a corrected bangla_meaning for EVERY entry that has a wrong, incomplete, or non-Bengali meaning.

RULES FOR WHAT IS WRONG:
1. Any meaning written in English letters (Roman script) — e.g. "in", "[In]", "ka", "verb", transliterations
2. Any meaning containing even one Latin/ASCII letter
3. A meaning that is the same word (or phonetic approximation) as the English word
4. A single wrong character used for a grammatical word (e.g. "ক" for "a")
5. Bracket-wrapped phonetic notation like "[aɪ]"

CORRECT MEANING RULES:
- Write entirely in Bengali Unicode script (বাংলা হরফ)
- Provide the most natural, everyday meaning that a Bangladeshi student would recognise instantly
- For function words / grammar words use brief explanations in Bangla:
    • "a" / "an" → "একটি (অনির্দিষ্ট পরিচিতি)"
    • "the" → "ঐ / এই (সুনির্দিষ্ট পরিচিতি)"
    • "in" → "ভেতরে / মধ্যে"
    • "on" → "উপরে / এর উপর"
    • "at" → "এ / তে (স্থান বা সময় বোঝায়)"
    • "to" → "কে / দিকে / জন্য"
    • "of" → "এর / র (সম্পর্ক বোঝায়)"
    • "and" → "এবং / ও"
    • "or" → "অথবা / বা"
    • "but" → "কিন্তু"
    • "is/am/are" → "হয় / আছে"
    • "I" → "আমি"
    • "you" → "তুমি / আপনি"
    • "he/she" → "সে / তিনি"
    • "it" → "এটি / ওটি"
- For nouns, adjectives, verbs: give a short, clear Bangla translation
- Do NOT add part-of-speech labels in English

OUTPUT FORMAT:
Return a JSON object: { "corrections": [ ... ] }
Each item MUST have "id". Only include "bangla_meaning" if it needs to change.
If the current meaning is already correct pure Bengali, include only the id (no bangla_meaning field).
Never add extra fields or prose outside the JSON.`;

async function callOpenAI(batch) {
  const input = batch.map((w) => ({
    id:             w.id,
    word:           w.word,
    bangla_meaning: w.bangla_meaning ?? '',
  }));

  const response = await openai.chat.completions.create({
    model:           MODEL,
    temperature:     0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: JSON.stringify(input) },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  if (!Array.isArray(parsed.corrections))
    throw new Error(`Unexpected response shape: ${JSON.stringify(parsed).slice(0, 200)}`);

  return parsed.corrections;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function fetchBatch(afterId, limit) {
  const { rows } = await pool.query(
    `SELECT id, word, bangla_meaning
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

    // Only process bangla_meaning changes
    const newMeaning = fix.bangla_meaning;
    if (!newMeaning || newMeaning === original.bangla_meaning) continue;

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] id=${fix.id} "${original.word}"`);
      console.log(`    bangla_meaning: "${original.bangla_meaning}"  →  "${newMeaning}"`);
      updated++;
      continue;
    }

    try {
      await pool.query(
        `UPDATE words SET bangla_meaning = $1 WHERE id = $2`,
        [newMeaning, fix.id],
      );
      console.log(`  Fixed id=${fix.id} "${original.word}": "${original.bangla_meaning}" → "${newMeaning}"`);
      updated++;
    } catch (err) {
      console.error(`  ERROR updating id=${fix.id} "${original.word}": ${err.message}`);
    }
  }

  return updated;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    process.exit(1);
  }

  if (DRY_RUN) console.log('DRY-RUN mode — no database writes.\n');

  // Quick scan to show how many obviously wrong entries exist
  const { rows: bad } = await pool.query(
    `SELECT id, word, bangla_meaning FROM words
     WHERE bangla_meaning IS NULL
        OR bangla_meaning ~ '[a-zA-Z]'
        OR bangla_meaning = word
     ORDER BY id
     LIMIT 50`,
  );
  if (bad.length > 0) {
    console.log(`Pre-scan: found ${bad.length}+ obviously wrong entries (sample):`);
    bad.slice(0, 15).forEach((r) =>
      console.log(`  id=${r.id}  "${r.word}"  →  "${r.bangla_meaning}"`),
    );
    console.log('');
  }

  const progress = loadProgress();
  console.log(`Starting from id > ${progress.lastProcessedId}  (fixed so far: ${progress.fixed})\n`);

  const { rows: [{ count }] } = await pool.query(
    'SELECT COUNT(*) FROM words WHERE id > $1', [progress.lastProcessedId],
  );
  const total   = parseInt(count, 10);
  const batches = Math.ceil(total / BATCH_SIZE);
  console.log(`${total} words remaining across ~${batches} batches (size ${BATCH_SIZE})\n`);

  let batchNum = 0;

  while (true) {
    const words = await fetchBatch(progress.lastProcessedId, BATCH_SIZE);
    if (words.length === 0) break;

    batchNum++;
    const lo = words[0].id;
    const hi = words[words.length - 1].id;

    const obviouslyWrong = words.filter((w) => looksWrong(w.word, w.bangla_meaning)).length;
    process.stdout.write(
      `Batch ${batchNum}/${batches}  ids ${lo}–${hi}  (${obviouslyWrong} flagged) … `,
    );

    const originalMap = new Map(words.map((w) => [w.id, w]));

    let corrections;
    try {
      corrections = await withRetry(() => callOpenAI(words), `batch ${batchNum}`);
    } catch (err) {
      console.error(`\n  Skipping batch: ${err.message}`);
      progress.errors += words.length;
      progress.lastProcessedId = hi;
      saveProgress(progress);
      await sleep(DELAY_MS);
      continue;
    }

    const updated = await applyCorrections(corrections, originalMap);

    progress.fixed            += updated;
    progress.skipped          += words.length - updated;
    progress.lastProcessedId   = hi;
    saveProgress(progress);

    console.log(`${updated} fixed, ${words.length - updated} unchanged`);

    await sleep(DELAY_MS);
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log(`Done!  fixed=${progress.fixed}  unchanged=${progress.skipped}  errors=${progress.errors}`);
  if (DRY_RUN) console.log('(No writes were made — re-run without --dry-run to apply.)');

  if (!DRY_RUN && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log('Progress file deleted.');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
