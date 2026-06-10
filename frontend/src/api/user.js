import { request } from '../utils/apiClient.js';

export async function getCurrentUser() {
  const response = await request('/user/me');
  return response.user;
}

export async function getProfile(userId) {
  const response = await request(`/user/get-profile/${userId}`);
  return response.user;
}

export async function updateProfile(userId, payload) {
  const response = await request(`/user/update-profile/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return response.user;
}

export async function changePassword(payload) {
  return request('/user/password/change', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(userId, file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const token = localStorage.getItem('articulate_access_token');
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/user/avatar/${userId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Avatar upload failed');
  }

  return response.json();
}

export async function updateMicStatus(userId, payload) {
  return request(`/user/mic/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function saveOnboarding(payload) {
  return request('/user/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

