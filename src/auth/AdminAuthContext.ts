import { createContext, useContext } from 'react';

// The provider component lives in AdminAuthProvider.tsx so that file only
// exports components (keeps Vite fast refresh working).

export interface AdminAuthContextValue {
  email: string | null;
  signedIn: boolean;
  signOut: () => void;
  setSignedIn: (email: string) => void;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
