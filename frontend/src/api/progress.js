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

export async function assessPronunciation(formData) {
  const token = localStorage.getItem('articulate_access_token');
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/assess/pronunciation/assess`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Pronunciation assessment failed');
  }

  return response.json();
}

export async function assessConversation(payload) {
  return request('/assess/conversation/assess', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRagSession() {
  return request('/assess/rag-session');
}

export async function getNotifications() {
  const response = await request('/notifications');
  return response.notifications || [];
}

export async function generalChat(payload) {
  return request('/assess/ai-chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitTestAttempt(payload) {
  return request('/assess/tests/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
