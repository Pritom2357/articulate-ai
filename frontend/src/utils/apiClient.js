import { getAccessToken } from './tokenStorage.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || 'API request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export { request };
