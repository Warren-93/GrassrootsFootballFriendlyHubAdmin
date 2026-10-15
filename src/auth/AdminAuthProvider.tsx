import { useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../api/adminRepository';
import { AdminAuthContext } from './AdminAuthContext';
import { tokenStore } from './tokenStore';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(tokenStore.email());

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
