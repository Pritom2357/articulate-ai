import { request, authorizedFetch } from '../utils/apiClient.js';

export async function startConversationSession(chapterId) {
  return request('/conversation/start', {
    method: 'POST',
    body: JSON.stringify({ chapterId }),
  });
}

export async function submitConversationTurn(sessionId, audioBlob, mimeType) {
  const formData = new FormData();
  formData.append('audio', audioBlob, `turn.${mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4'}`);

  const response = await authorizedFetch(`/conversation/${sessionId}/turn`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Turn submission failed');
  }
  return response.json();
}

export async function endConversationSession(sessionId) {
  return request(`/conversation/${sessionId}/end`, { method: 'POST' });
}
