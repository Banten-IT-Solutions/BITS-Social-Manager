import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';

/**
 * Shared sign-out flow (used by the desktop sidebar rail and the mobile bottom nav):
 * best-effort server logout, clear local auth state, redirect to /login.
 */
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(state => state.clearAuth);

  return useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);
}
