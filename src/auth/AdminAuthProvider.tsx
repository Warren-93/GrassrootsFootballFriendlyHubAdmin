import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../api/adminRepository';
import { AdminAuthContext } from './AdminAuthContext';
import { SESSION_EXPIRED_EVENT, tokenStore } from './tokenStore';
import { refreshSessionIfDue } from './sessionRefresh';

// How often activity (clicks, typing) may trigger a session check.
const ACTIVITY_CHECK_MS = 60 * 1000;

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(tokenStore.email());

  // The API client has already cleared the token by the time this fires;
  // dropping the email here lets ProtectedRoute send the admin to sign-in.
  useEffect(() => {
    const onExpired = () => setEmail(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Reading a page or filling in a form makes no API calls, so activity
  // counts too: it renews the token before the 30-minute idle timeout.
  useEffect(() => {
    let lastCheck = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastCheck < ACTIVITY_CHECK_MS) return;
      lastCheck = now;
      void refreshSessionIfDue(now);
    };
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);
    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, []);

  // Tabs share one session: signing in or out in one updates the others.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === tokenStore.key) setEmail(tokenStore.email());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function signOut() {
    authRepository.signOut();
    setEmail(null);
  }

  function setSignedIn(newEmail: string) {
    setEmail(newEmail);
  }

  return (
    <AdminAuthContext.Provider value={{ email, signedIn: email !== null, signOut, setSignedIn }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
