// frontend/src/utils/api.ts
/// <reference types="vite/client" />

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8080';

// ── Token helper ─────────────────────────────────────────────────────────────
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// ── Core request function ─────────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-2xx responses
  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      
      // If FastAPI returns a 422 Validation Error array
      if (Array.isArray(errorData?.detail)) {
        errorMessage = errorData.detail.map((err: any) => err.msg).join(', ');
      } 
      // If it's a standard string detail or message
      else if (errorData?.detail) {
        errorMessage = errorData.detail;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If the response wasn't JSON (e.g. 502 Bad Gateway HTML page)
      if (response.status === 502 || response.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (response.status === 404) {
        errorMessage = 'Requested resource not found.';
      }
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (204 No Content)
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── Public API methods ────────────────────────────────────────────────────────
export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

export { API_BASE_URL };
export default api;
