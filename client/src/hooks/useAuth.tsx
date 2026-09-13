import { createContext, useContext, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { firstName: string; lastName: string; email: string; password: string; organizationName: string }) => Promise<void>;
  acceptInvite: (input: { token: string; firstName: string; lastName: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  function persistSession(data: { accessToken: string; user: AuthUser; defaultOrganizationId: string | null }) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.defaultOrganizationId) localStorage.setItem('activeOrganizationId', data.defaultOrganizationId);
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    persistSession(data);
  }

  async function register(input: { firstName: string; lastName: string; email: string; password: string; organizationName: string }) {
    const { data } = await api.post('/auth/register', input);
    persistSession(data);
  }

  async function acceptInvite(input: { token: string; firstName: string; lastName: string; password: string }) {
    const { data } = await api.post('/auth/accept-invite', input);
    persistSession(data);
  }

  function logout() {
    api.post('/auth/logout').catch(() => {});
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, acceptInvite, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
