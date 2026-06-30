import { request, authorizedFetch } from '../utils/apiClient.js';

/**
 * POST /api/exam/generate
 * Body: { examType, lessonId?, chapterId? }
 * Returns: { success, examId, exam, questions }
 */
export const generateExam = async (data) => {
    return request('/exam/generate', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/**
 * GET /api/exam/:id
 * Returns: { success, data: { exam, questions, answers } }
 */
export const getExamById = async (examId) => {
    return request(`/exam/${examId}`);
};

/**
 * POST /api/exam/:id/submit
 * Body: FormData with `answers` (JSON string) + optional `audio_{questionId}` files
 * Returns: { success, message }
 */
export const submitExamAnswers = async (examId, formData) => {
    const response = await authorizedFetch(`/exam/${examId}/submit`, {
        method: 'POST',
        body: formData
        // No Content-Type header — browser sets it with boundary for FormData
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw errData || new Error('Submission failed');
    }
    return response.json();
};

/**
 * GET /api/exam/:id/results
 * Returns: { success, data: { exam, questions, answers } } when EVALUATED
 *       or { success, status, message } when still pending
 */
export const getExamResults = async (examId) => {
    return request(`/exam/${examId}/results`);
};

/**
 * GET /api/exam/history
 * Returns: { success, data: [...exams] }
 */
export const getExamHistory = async () => {
    return request('/exam/history');
};

/**
 * POST /api/exam/:id/retake
 * Returns: { success, examId, exam, questions }
 */
export const retakeExam = async (examId) => {
    return request(`/exam/${examId}/retake`, {
        method: 'POST'
    });
};

/**
 * GET /api/exam/answer/:answerId/audio
 * Returns a Blob URL for the audio
 */
export const getAnswerAudioBlobUrl = async (answerId) => {
    const response = await authorizedFetch(`/exam/answer/${answerId}/audio`);
    if (!response.ok) throw new Error('Failed to fetch audio');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};
