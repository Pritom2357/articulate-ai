/**
 * One-time routine: generate male-voiced audio for every word and phrase,
 * upload to Cloudinary, and store the URL in the new audio_url_m column.
 *
 * Voice: en-US-AndrewNeural (Azure Neural TTS — natural, clear male voice)
 *
 * Usage (run from backend/):
 *   node src/database/generateMaleAudio.js              # words + phrases
 *   node src/database/generateMaleAudio.js --words      # words only
 *   node src/database/generateMaleAudio.js --phrases    # phrases only
 *
 * Resumable: rows where audio_url_m is already set are skipped automatically.
 * After a successful full run, delete this file.
 */

const { Pool }       = require('pg');
const { v2: cld }    = require('cloudinary');
const https          = require('https');
const path           = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ──────────────────────────────────────────────────────────────────

const MALE_VOICE    = 'en-US-AndrewNeural';
const AZURE_KEY     = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION  = process.env.AZURE_SPEECH_REGION || 'southeastasia';
const BATCH_SIZE    = 30;
const MAX_RETRIES   = 3;

const DO_WORDS   = !process.argv.includes('--phrases');
const DO_PHRASES = !process.argv.includes('--words');
const DELAY_MS   = DO_PHRASES && !DO_WORDS ? 500 : 150;  // slower for phrase-only retries

// ─── Clients ─────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

cld.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safePublicId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

// ─── Azure TTS ───────────────────────────────────────────────────────────────

function ttsRequest(text) {
  return new Promise((resolve, reject) => {
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
  <voice name='${MALE_VOICE}'>
    <prosody rate='slow'>${xmlEscape(text)}</prosody>
  </voice>
</speak>`;

    const options = {
      hostname: `${AZURE_REGION}.tts.speech.microsoft.com`,
      path:     '/cognitiveservices/v1',
      method:   'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type':              'application/ssml+xml',
        'X-Microsoft-OutputFormat':  'audio-16khz-32kbitrate-mono-mp3',
        'User-Agent':                'articulate-ai-tts',
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        const retryAfter = res.headers['retry-after'];
        const msg = retryAfter
          ? `Azure TTS returned HTTP ${res.statusCode} (retry after ${retryAfter}s)`
          : `Azure TTS returned HTTP ${res.statusCode}`;
        return reject(new Error(msg));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
    req.write(ssml);
    req.end();
  });
}

async function generateAudio(text) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await ttsRequest(text);
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await sleep(500 * attempt);
    }
  }
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────

function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        resource_type: 'video',           // Cloudinary uses 'video' for audio
        folder:        'articulate-ai/audio/m',
        public_id:     publicId,
        format:        'mp3',
        overwrite:     true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

// ─── Migration ────────────────────────────────────────────────────────────────

async function addColumns() {
  await pool.query(`ALTER TABLE words   ADD COLUMN IF NOT EXISTS audio_url_m TEXT`);
  await pool.query(`ALTER TABLE phrases ADD COLUMN IF NOT EXISTS audio_url_m TEXT`);
  console.log('✅  audio_url_m column ready on words and phrases\n');
}

// ─── Process words ────────────────────────────────────────────────────────────

async function processWords() {
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM words WHERE audio_url_m IS NULL`,
  );
  const total = parseInt(count, 10);
  console.log(`📖  Words to process: ${total}\n`);

  let done = 0;
  let offset = 0;

  while (true) {
    const { rows } = await pool.query(
      `SELECT id, word FROM words WHERE audio_url_m IS NULL ORDER BY id LIMIT $1`,
      [BATCH_SIZE],
    );
    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        const audioBuffer = await generateAudio(row.word);
        const publicId    = `${String(row.id).padStart(5, '0')}_${safePublicId(row.word)}_m`;
        const url         = await uploadToCloudinary(audioBuffer, publicId);

        await pool.query(`UPDATE words SET audio_url_m = $1 WHERE id = $2`, [url, row.id]);
        done++;
        process.stdout.write(`  [${done}/${total}] ${row.word} ✓\n`);
      } catch (err) {
        console.error(`  ❌  id=${row.id} "${row.word}": ${err.message}`);
        // Mark with a sentinel so it's skipped on resume; clear manually to retry
        await pool.query(`UPDATE words SET audio_url_m = 'ERROR' WHERE id = $1`, [row.id]);
      }

      await sleep(DELAY_MS);
    }

    offset += rows.length;
  }

  console.log(`\n✅  Words done: ${done}/${total}\n`);
}

// ─── Process phrases ──────────────────────────────────────────────────────────

async function processPhrases() {
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM phrases WHERE audio_url_m IS NULL`,
  );
  const total = parseInt(count, 10);
  console.log(`💬  Phrases to process: ${total}\n`);

  let done = 0;

  while (true) {
    const { rows } = await pool.query(
      `SELECT id, phrase_en FROM phrases WHERE audio_url_m IS NULL ORDER BY id LIMIT $1`,
      [BATCH_SIZE],
    );
    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        const audioBuffer = await generateAudio(row.phrase_en);
        const publicId    = `phrase_${String(row.id).padStart(4, '0')}_m`;
        const url         = await uploadToCloudinary(audioBuffer, publicId);

        await pool.query(`UPDATE phrases SET audio_url_m = $1 WHERE id = $2`, [url, row.id]);
        done++;
        process.stdout.write(`  [${done}/${total}] "${row.phrase_en}" ✓\n`);
      } catch (err) {
        console.error(`  ❌  id=${row.id} "${row.phrase_en}": ${err.message}`);
        await pool.query(`UPDATE phrases SET audio_url_m = 'ERROR' WHERE id = $1`, [row.id]);
      }

      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅  Phrases done: ${done}/${total}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!AZURE_KEY) {
    console.error('❌  AZURE_SPEECH_KEY is not set in .env');
    process.exit(1);
  }

  console.log(`🎙  Male voice: ${MALE_VOICE}`);
  console.log(`🌐  Azure region: ${AZURE_REGION}\n`);

  await addColumns();

  if (DO_WORDS)   await processWords();
  if (DO_PHRASES) await processPhrases();

  console.log('🎉  All done!');
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
