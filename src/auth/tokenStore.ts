// No refresh token for admin sessions - a plain 30-minute expiry per ADM-01
// ("session timeout of 30 minutes") is the point; a refresh flow would
// undermine it.
const ACCESS_KEY = 'gffh-admin.accessToken';
const EMAIL_KEY = 'gffh-admin.email';

/** Fired on window when the API rejects the stored token, so the UI can sign out too. */
export const SESSION_EXPIRED_EVENT = 'gffh-admin.session-expired';

export const tokenStore = {
  accessToken(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  },
  email(): string | null {
    return sessionStorage.getItem(EMAIL_KEY);
  },
  set(accessToken: string, email: string) {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    sessionStorage.setItem(EMAIL_KEY, email);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
  },
};
