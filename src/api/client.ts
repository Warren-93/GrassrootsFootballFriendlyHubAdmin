import type { ApiResult } from './result';
import { fail, ok } from './result';
import { tokenStore } from '../auth/tokenStore';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error?.message === 'string') return body.error.message;
    if (typeof body?.message === 'string') return body.message;
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // Body wasn't JSON.
  }
  return `Request failed (${response.status})`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, query, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const accessToken = tokenStore.accessToken();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && auth) {
      // Session expired (30-minute ADM-01 timeout) - clear and let the
      // caller redirect to sign-in rather than trying to silently refresh.
      tokenStore.clear();
    }

    if (!response.ok) {
      return fail(await parseErrorMessage(response), response.status);
    }
    if (response.status === 204) {
      return ok(undefined as T);
    }
    return ok((await response.json()) as T);
  } catch {
    return fail('Network error - check your connection and try again.');
  }
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query'], auth = true) =>
    request<T>(path, { method: 'GET', query, auth }),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PUT', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
};
