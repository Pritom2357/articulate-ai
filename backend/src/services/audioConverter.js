/**
 * Lightweight audio format converter using ffmpeg-static.
 * When the DeepFilterNet denoiser worker is unavailable, Azure's pronunciation
 * assessment REST endpoint still needs 16kHz mono PCM WAV — it silently produces
 * all-zero scores when handed raw webm/opus from the browser's MediaRecorder.
 * This module provides that bare-minimum conversion without the denoiser.
 */
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

let ffmpegPath;
try {
  ffmpegPath = require('ffmpeg-static');
} catch {
  ffmpegPath = null;
}

/**
 * Convert an audio buffer (webm, ogg, mp4, etc.) to 16kHz mono PCM16 WAV.
 * @param {Buffer} audioBuffer
 * @returns {Promise<Buffer>} WAV buffer
 */
async function convertToWav(audioBuffer) {
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static not available');
  }

  // Write input to a temp file since ffmpeg's pipe:0 can be flaky on Windows
  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const inPath = path.join(tmpDir, `articulate_in_${ts}`);
  const outPath = path.join(tmpDir, `articulate_out_${ts}.wav`);

  try {
    fs.writeFileSync(inPath, audioBuffer);

    await new Promise((resolve, reject) => {
      execFile(
        ffmpegPath,
        [
          '-hide_banner', '-loglevel', 'error',
          '-i', inPath,
          '-ac', '1',       // mono
          '-ar', '16000',   // 16kHz sample rate
          '-f', 'wav',
          '-y',             // overwrite output
          outPath
        ],
        { timeout: 15000 },
        (err, _stdout, stderr) => {
          if (err) {
            reject(new Error(stderr || err.message));
          } else {
            resolve();
          }
        }
      );
    });

    return fs.readFileSync(outPath);
  } finally {
    // Cleanup temp files
    try { fs.unlinkSync(inPath); } catch { /* ignore */ }
    try { fs.unlinkSync(outPath); } catch { /* ignore */ }
  }
}

module.exports = { convertToWav };
