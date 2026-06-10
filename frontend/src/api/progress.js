import { request } from '../utils/apiClient.js';

export async function getDueFlashcards() {
  const response = await request('/progress/flashcards/due');
  return response.cards || [];
}

export async function reviewFlashcard(payload) {
  const response = await request('/progress/flashcards/review', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.card;  // was returning raw response
}

export async function markLessonComplete(payload) {
  const response = await request('/progress/lesson', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // returns { lesson, xp, level } — keep full shape for caller to use
  return response;
}

export async function getProgress() {
  const response = await request('/progress');
  return response.progress;  // was returning raw response
}