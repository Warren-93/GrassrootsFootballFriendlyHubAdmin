import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext';

export function ProtectedRoute() {
  const { signedIn } = useAdminAuth();
  if (!signedIn) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}
