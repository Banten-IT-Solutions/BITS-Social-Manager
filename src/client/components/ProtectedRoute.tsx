import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

/** Blocks unauthenticated users; remembers where they were heading. */
export function ProtectedRoute() {
  const { token } = useAuthStore();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Blocks authenticated users from seeing auth pages (login/register). */
export function PublicRoute() {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
