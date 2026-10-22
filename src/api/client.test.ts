import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';
import { tokenStore } from '../auth/tokenStore';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as Response;
}

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns ok:true with the parsed body on a successful request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { id: '1', email: 'admin@example.com' }));

    const result = await apiClient.get<{ id: string; email: string }>('/api/v1/admin/users/1');

    expect(result).toEqual({ ok: true, value: { id: '1', email: 'admin@example.com' } });
  });

  it('treats a 200 with no body as success (merge, force password reset, resend verification)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, undefined));

    const result = await apiClient.post<void>('/api/v1/admin/users/1/force-password-reset');

    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('surfaces the backend error envelope message on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(404, { error: { code: 'USER_NOT_FOUND', message: 'That user could not be found.' } }),
    );

    const result = await apiClient.get('/api/v1/admin/users/missing');

    expect(result).toEqual({ ok: false, message: 'That user could not be found.', status: 404 });
  });

  it('falls back to a status-based message when the error body is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    const result = await apiClient.get('/api/v1/admin/users/1');

    expect(result).toEqual({ ok: false, message: 'Request failed (500)', status: 500 });
  });

  it('returns a network-error message when fetch itself throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await apiClient.get('/api/v1/admin/users/1');

    expect(result).toEqual({ ok: false, message: 'Network error - check your connection and try again.' });
  });

  it('clears the session on a 401 without attempting a retry (no refresh token for admin sessions)', async () => {
    tokenStore.set('expired-admin-token', 'admin@example.com');
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(401, { error: { message: 'Session expired' } }));

    const result = await apiClient.get('/api/v1/admin/users/1');

    expect(result.ok).toBe(false);
    expect(tokenStore.accessToken()).toBeNull();
    expect(tokenStore.email()).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('sends the stored bearer token on an authenticated request', async () => {
    tokenStore.set('a-valid-token', 'admin@example.com');
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, []));

    await apiClient.get('/api/v1/admin/reports');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer a-valid-token' });
  });
});
