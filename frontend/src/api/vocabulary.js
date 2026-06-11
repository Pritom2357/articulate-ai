import { request } from '../utils/apiClient.js';

export async function getUserVocabulary(filter = 'all') {
  const response = await request(`/vocabulary?filter=${encodeURIComponent(filter)}`);
  return response.vocabulary || [];
}

export async function getBookmarks() {
  const response = await request('/vocabulary/bookmarks');
  return response.bookmarks || [];
}

export async function addBookmark(wordId) {
  const response = await request(`/vocabulary/bookmark/${wordId}`, {
    method: 'POST',
  });
  return response;
}

export async function removeBookmark(wordId) {
  const response = await request(`/vocabulary/bookmark/${wordId}`, {
    method: 'DELETE',
  });
  return response;
}
