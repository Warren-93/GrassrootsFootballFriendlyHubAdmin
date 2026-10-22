import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshSessionIfDue } from './sessionRefresh';
import { tokenExpiresAt, tokenStore } from './tokenStore';

function tokenExpiringIn(ms: number): string {
  const payload = btoa(JSON.stringify({ sub: 'admin-1', exp: Math.floor((Date.now() + ms) / 1000) }));
  return `header.${payload.replace(/=+$/, '')}.signature`;
}

describe('refreshSessionIfDue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the expiry from the token', () => {
    const token = tokenExpiringIn(60_000);
    expect(tokenExpiresAt(token)).toBeGreaterThan(Date.now());
    expect(tokenExpiresAt('not-a-jwt')).toBeNull();
  });

  it('leaves a fresh token alone', async () => {
    tokenStore.set(tokenExpiringIn(29 * 60_000), 'admin@example.com');
    await refreshSessionIfDue();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('swaps a token with under 20 minutes left for a new one', async () => {
    const old = tokenExpiringIn(10 * 60_000);
    tokenStore.set(old, 'admin@example.com');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'new-token', tokenType: 'Bearer', expiresIn: 1800, email: 'admin@example.com' }),
    } as Response);

    await refreshSessionIfDue();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/auth/refresh'),
      expect.objectContaining({ method: 'POST', headers: { Authorization: `Bearer ${old}` } }),
    );
    expect(tokenStore.accessToken()).toBe('new-token');
  });

  it('keeps the current token when the refresh fails', async () => {
    const old = tokenExpiringIn(5 * 60_000);
    tokenStore.set(old, 'admin@example.com');
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response);

    await refreshSessionIfDue();

    expect(tokenStore.accessToken()).toBe(old);
  });

  it('does nothing for an already-expired token', async () => {
    tokenStore.set(tokenExpiringIn(-1000), 'admin@example.com');
    await refreshSessionIfDue();
    expect(fetch).not.toHaveBeenCalled();
  });
});
