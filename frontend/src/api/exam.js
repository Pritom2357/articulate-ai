import { request, authorizedFetch } from '../utils/apiClient.js';

export const generateExam = async (data) => {
    return request('/exam/generate', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const submitExamAnswers = async (examId, formData) => {
    // When sending FormData, the browser sets the correct Content-Type with boundary automatically
    const response = await authorizedFetch(`/exam/${examId}/submit`, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw errData || new Error('Submission failed');
    }
    return response.json();
};

export const getExamResults = async (examId) => {
    return request(`/exam/${examId}/results`);
};

export const getExamHistory = async () => {
    return request('/exam/history');
};

export const retakeExam = async (examId) => {
    return request(`/exam/${examId}/retake`, {
        method: 'POST'
    });
};
