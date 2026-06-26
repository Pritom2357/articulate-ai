import { request, authorizedFetch } from '../utils/apiClient.js';

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
  const response = await authorizedFetch('/assess/pronunciation/assess', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Pronunciation assessment failed');
  }

  return response.json();
}

export async function getPronunciationFeedback(phonemeScores) {
  return request('/assess/pronunciation/feedback', {
    method: 'POST',
    body: JSON.stringify({ phonemeScores }),
  });
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

export async function getNotifications({ limit = 30, offset = 0, filter = 'ALL' } = {}) {
  const params = new URLSearchParams({ limit, offset, filter });
  const response = await request(`/notifications?${params}`);
  return response; // { notifications, unreadCount, pagination }
}

export async function getUnreadNotificationCount() {
  const response = await request('/notifications/unread-count');
  return response.count || 0;
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'PATCH' });
}

export async function deleteNotification(id) {
  return request(`/notifications/${id}`, { method: 'DELETE' });
}

export async function deleteAllNotifications() {
  return request('/notifications', { method: 'DELETE' });
}

export async function getXpLog(limit = 100) {
  const response = await request(`/progress/xp-log?limit=${limit}`);
  return response.logs || [];
}

export async function getLeaderboard(limit = 100) {
  const response = await request(`/progress/leaderboard?limit=${limit}`);
  return response.leaderboard || [];
}

export async function getStreakCalendar(year, month) {
  const response = await request(`/progress/streak-calendar?year=${year}&month=${month}`);
  return response.activeDates || [];
}

export async function generalChat(payload) {
  return request('/chatbot/chat', {
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

export async function textToSpeech(text, voice = 'en-US-JennyNeural') {
  const response = await authorizedFetch('/chatbot/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Text-to-speech failed');
  }

  return response.blob();
}
