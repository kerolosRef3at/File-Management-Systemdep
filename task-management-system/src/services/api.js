// Central API Client for EGC Ticketing System Backend

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken() {
  return localStorage.getItem('token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

/**
 * Resolves a relative file/upload path (e.g. "/uploads/signatures/x.png"
 * returned by the backend) into an absolute URL against the API's origin.
 * Uploaded files are served as static content from the API host, not
 * behind the "/api" prefix, so we strip that prefix before joining.
 * Already-absolute URLs (http/https) are returned unchanged.
 */
export function getFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  let origin;
  if (/^https?:\/\//i.test(BASE_URL)) {
    origin = BASE_URL.replace(/\/api\/?$/i, '');
  } else {
    // BASE_URL is relative (e.g. '/api') — resolve against current origin
    origin = window.location.origin + BASE_URL.replace(/\/api\/?$/i, '');
  }

  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Universal request wrapper for backend REST endpoints
 * @param {string} endpoint - API path e.g. '/tickets'
 * @param {object} options - fetch options (method, headers, body)
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set Content-Type to application/json
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Global session-expiry handling: if the backend rejects the token (401),
  // the token is stale/invalid/expired. Clear the local session and let
  // App.jsx redirect to /login instead of leaving broken authenticated
  // screens on the page. We only do this for calls that actually sent a
  // token — an anonymous 401 on /auth/login itself should NOT trigger this.
  if (response.status === 401 && token) {
    setAuthToken('');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Parse JSON response or fallback to text
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    // Extract server error details
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    if (data) {
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.errors && typeof data.errors === 'object') {
        // Validation dictionary errors
        const errorList = Object.values(data.errors).flat();
        errorMessage = errorList.join(', ');
      } else if (data.title) {
        errorMessage = data.title;
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

// Re-exported for convenience so callers can `import api, { getFileUrl } from '../services/api'`
api.getFileUrl = getFileUrl;

export default api;
