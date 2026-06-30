import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.tokens) {
    throw new Error(data?.error || 'Token refresh failed');
  }

  setTokens(data.tokens);
  return data.tokens.accessToken;
}

// Concurrent 401s all share one in-flight refresh call instead of each firing their own.
function ensureSingleRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function forceLogout() {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

async function request(path, options = {}, _isRetry = false) {
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
    if (response.status === 401 && !_isRetry && path !== '/auth/refresh') {
      try {
        await ensureSingleRefresh();
        return request(path, options, true);
      } catch (refreshErr) {
        forceLogout();
        throw refreshErr;
      }
    }

    const error = new Error(data?.error || data?.message || 'API request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

/**
 * For calls that need a raw fetch (e.g. FormData uploads) but still want
 * automatic access-token refresh-and-retry on 401, same as request().
 */
async function authorizedFetch(path, options = {}, _isRetry = false) {
  const token = getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401 && !_isRetry) {
    try {
      await ensureSingleRefresh();
      return authorizedFetch(path, options, true);
    } catch (refreshErr) {
      forceLogout();
      throw refreshErr;
    }
  }

  return response;
}

export { request, authorizedFetch, API_BASE };
