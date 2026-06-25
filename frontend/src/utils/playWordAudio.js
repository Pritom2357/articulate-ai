import { fetchAndCacheAudio } from './audioCache.js';
import { speakText } from './tts.js';

let currentAudio = null;

/**
 * Play pronunciation for a word or phrase item.
 * Prefers item.audio_url (fetched once, then served from localStorage cache with 7-day TTL).
 * Falls back to Web Speech API TTS when audio_url is absent or fails.
 *
 * @param {object} item     - word or phrase object; needs audio_url?, word? or phrase_en?
 * @param {string} gender   - 'MALE' | 'FEMALE' for TTS voice selection
 * @param {function} onStart - called when playback begins
 * @param {function} onEnd   - called when playback ends
 */
export async function playWordAudio(item, gender, onStart, onEnd) {
  // Stop anything already playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();

  const text = item?.word || item?.phrase_en || '';

  if (item?.audio_url) {
    try {
      const src = await fetchAndCacheAudio(item.audio_url);
      const audio = new Audio(src);
      currentAudio = audio;
      onStart?.();

      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = reject;
        audio.play().catch(reject);
      });

      onEnd?.();
      currentAudio = null;
      return;
    } catch (err) {
      console.warn('audio_url playback failed, falling back to TTS:', err);
      currentAudio = null;
    }
  }

  speakText(text, gender, onStart, onEnd);
}
