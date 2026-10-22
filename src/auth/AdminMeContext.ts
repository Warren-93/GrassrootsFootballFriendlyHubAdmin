import { createContext, useContext } from 'react';
import type { AdminMe } from '../api/types';

/**
 * The signed-in admin's account and level, loaded once by AdminLayout.
 * Null until it has loaded (and against an API too old to say), so treat
 * null as "not the super admin" - the API enforces the same either way.
 */
export const AdminMeContext = createContext<AdminMe | null>(null);

export function useAdminMe(): AdminMe | null {
  return useContext(AdminMeContext);
}

export function useIsSuperAdmin(): boolean {
  return useAdminMe()?.role === 'SUPER_ADMIN';
}
