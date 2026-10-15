import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../api/adminRepository';
import { AdminAuthContext } from './AdminAuthContext';
import { SESSION_EXPIRED_EVENT, tokenStore } from './tokenStore';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(tokenStore.email());

  // The API client has already cleared the token by the time this fires;
  // dropping the email here lets ProtectedRoute send the admin to sign-in.
  useEffect(() => {
    const onExpired = () => setEmail(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
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
