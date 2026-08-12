import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../api/adminRepository';
import { tokenStore } from './tokenStore';

interface AdminAuthContextValue {
  email: string | null;
  signedIn: boolean;
  signOut: () => void;
  setSignedIn: (email: string) => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

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

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
