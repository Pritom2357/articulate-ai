import { request } from '../utils/apiClient.js';

export async function getChapters() {
  const response = await request('/curriculum/chapters');
  return response.chapters || [];
}

export async function getChapter(id) {
  const response = await request(`/curriculum/chapters/${id}`);
  return {
    chapter: response.chapter || response,
    lessons: response.lessons || response.chapter?.lessons || [],
  };
}

export async function getLessonsByChapter(chapterId) {
  const response = await request(`/curriculum/chapters/${chapterId}/lessons`);
  return response.lessons || [];
}

export async function getLesson(id) {
  const response = await request(`/curriculum/lessons/${id}`);
  return {
    lesson: response.lesson || response,
    words: response.words || response.lesson?.words || [],
  };
}

export async function getWordsByLesson(lessonId) {
  const response = await request(`/curriculum/lessons/${lessonId}/words`);
  return response.words || [];  // was returning raw response
}

export async function getWord(id) {
  const response = await request(`/curriculum/words/${id}`);
  return response.word;  // was returning raw response
}

export async function getWordsBulk(ids) {
  const response = await request('/curriculum/words/bulk', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
  return response.words || [];  // was returning raw response
}
