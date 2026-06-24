import { request } from '../utils/apiClient.js';

export async function getChapters() {
  const response = await request('/curriculum/chapters');
  return response.chapters || [];
}

export async function getChapter(id) {
  const response = await request(`/curriculum/chapters/${id}`);
  return {
    chapter: response.chapter?.chapter || response.chapter || response,
    lessons: response.chapter?.lessons || response.lessons || [],
  };
}

export async function getLessonsByChapter(chapterId) {
  const response = await request(`/curriculum/chapters/${chapterId}/lessons`);
  return response.lessons || [];
}

export async function getLesson(id) {
  const response = await request(`/curriculum/lessons/${id}`);
  return {
    lesson: response.lesson?.lesson || response.lesson || response,
    words: response.lesson?.words || response.words || [],
    phrases: response.lesson?.phrases || response.phrases || [],
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

export async function getTests() {
  const response = await request('/curriculum/tests');
  return response.tests || [];
}

export async function getTestDetails(testId) {
  const response = await request(`/curriculum/tests/${testId}`);
  return response;
}

export async function searchCurriculum(keyWord, type = 'all') {
  const response = await request(`/curriculum/search?keyWord=${encodeURIComponent(keyWord)}&type=${encodeURIComponent(type)}`);
  return response.results;
}

