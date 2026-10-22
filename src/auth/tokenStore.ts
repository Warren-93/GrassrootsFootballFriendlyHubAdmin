// The admin token lasts 30 minutes (ADM-01's idle timeout). While the admin
// keeps working, sessionRefresh swaps it for a fresh one before it runs out;
// left alone for 30 minutes it expires and the admin signs in again. Kept in
// localStorage so every tab of the admin site shares one session.
const ACCESS_KEY = 'gffh-admin.accessToken';
const EMAIL_KEY = 'gffh-admin.email';

/** Fired on window when the API rejects the stored token, so the UI can sign out too. */
export const SESSION_EXPIRED_EVENT = 'gffh-admin.session-expired';

// Storage can throw (private windows, blocked site data); treat that as signed out.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Nothing to do - the session just won't outlive this page.
  }
}

/** The token's expiry (ms since epoch) from its "exp" claim, or null if it can't be read. */
export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const tokenStore = {
  accessToken(): string | null {
    return read(ACCESS_KEY);
  },
  email(): string | null {
    return read(EMAIL_KEY);
  },
  set(accessToken: string, email: string) {
    write(ACCESS_KEY, accessToken);
    write(EMAIL_KEY, email);
  },
  clear() {
    write(ACCESS_KEY, null);
    write(EMAIL_KEY, null);
  },
  /** The storage key other tabs see change, for AdminAuthProvider's storage listener. */
  key: ACCESS_KEY,
};
