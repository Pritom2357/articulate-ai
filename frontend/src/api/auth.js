import { request } from '../utils/apiClient.js';
import { setTokens, clearTokens } from '../utils/tokenStorage.js';

export async function register(payload) {
  const response = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.tokens) {
    setTokens({
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    });
  }

  return response;
}

export async function login(payload) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.tokens) {
    setTokens({
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    });
  }

  return response;
}

export async function logout(userId) {
  await request(`/auth/logout/${userId}`, {
    method: 'POST',
  });
  clearTokens();
}