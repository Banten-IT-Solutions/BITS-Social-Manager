import type { Project, SocialAccount, User } from './types';

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Parse defensively: error responses (or a broken gateway) may not be JSON.
  const text = await res.text();
  let data: Record<string, unknown> | undefined;
  try {
    data = text ? JSON.parse(text) as Record<string, unknown> : undefined;
  } catch { /* non-JSON body — fall through */ }

  if (!res.ok) {
    throw new Error((data?.['error'] as string | undefined) ?? `HTTP ${res.status}`);
  }
  return data as T;
}

// Auth
export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      req<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      req<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => req<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  },
  profile: {
    get: () => req<{ user: User }>('/profile'),
    update: (body: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) =>
      req<{ user: User }>('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  projects: {
    list: () => req<{ projects: Project[] }>('/projects'),
    get: (id: string) => req<{ project: Project }>(`/projects/${id}`),
    create: (body: { name: string; description?: string }) =>
      req<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; description?: string }) =>
      req<{ project: Project }>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      req<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  },
  accounts: {
    list: (projectId?: string) =>
      req<{ accounts: SocialAccount[] }>(`/accounts${projectId ? `?projectId=${projectId}` : ''}`),
    get: (id: string) => req<{ account: SocialAccount }>(`/accounts/${id}`),
    create: (body: { projectId: string; platform: string; accountName: string; emailHandle: string; password: string; notes?: string }) =>
      req<{ account: SocialAccount }>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { platform?: string; accountName?: string; emailHandle?: string; password?: string; notes?: string }) =>
      req<{ account: SocialAccount }>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      req<{ success: boolean }>(`/accounts/${id}`, { method: 'DELETE' }),
  },
};
