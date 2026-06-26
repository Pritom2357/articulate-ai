const DENOISER_WORKER_URL = process.env.DENOISER_WORKER_URL || 'http://localhost:8001';

/**
 * Sends raw recorded audio to the Python DeepFilterNet worker and returns the denoised
 * audio as a 16kHz mono WAV buffer, ready to forward to Azure unchanged.
 * @param {Buffer} audioBuffer
 * @param {string|null} mimeType - the browser-reported mimetype (webm/ogg/mp4/wav/...)
 * @returns {Promise<Buffer>}
 */
async function denoise(audioBuffer, mimeType) {
  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || 'application/octet-stream' });
  form.append('audio', blob, 'attempt.audio');

  const response = await fetch(`${DENOISER_WORKER_URL}/denoise`, {
    method: 'POST',
    body: form
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Denoiser worker responded ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = { denoise };
