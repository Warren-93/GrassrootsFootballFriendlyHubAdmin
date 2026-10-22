import { API_BASE_URL } from '../api/client';
import type { SessionResponse } from '../api/types';
import { tokenExpiresAt, tokenStore } from './tokenStore';

// Swap the token once it has under this long left. Tokens last 30 minutes, so
// an admin who does anything at least every 20 minutes or so stays signed in.
const REFRESH_WHEN_LEFT_MS = 20 * 60 * 1000;

let inFlight: Promise<void> | null = null;

/**
 * Renews the admin token when it's getting old. Called after each successful
 * API call and on user activity (AdminAuthProvider), so it only extends a
 * session somebody is actually using. A failed refresh is left alone: the
 * current token keeps working until it expires, and the next 401 signs out.
 */
export function refreshSessionIfDue(now: number = Date.now()): Promise<void> {
  const token = tokenStore.accessToken();
  if (!token || inFlight) return inFlight ?? Promise.resolve();
  const expiresAt = tokenExpiresAt(token);
  if (expiresAt === null || expiresAt <= now || expiresAt - now > REFRESH_WHEN_LEFT_MS) return Promise.resolve();

  inFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Only replace the token we refreshed: another tab may have signed out or in meanwhile.
      if (response.ok && tokenStore.accessToken() === token) {
        const session = (await response.json()) as SessionResponse;
        tokenStore.set(session.accessToken, session.email);
      }
    } catch {
      // Offline or the API is waking up - try again on the next call.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
