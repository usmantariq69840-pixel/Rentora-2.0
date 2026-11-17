import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import SignInPrompt from '../components/auth/SignInPrompt';
import type { User } from '../types';
import { api } from './api';

export type DemoAccount = 'owner' | 'renter' | 'admin';

interface AuthApi {
  user: User | null;
  /** True until the first "who am I?" check finishes */
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  demoLogin: (account: DemoAccount) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (input: { name: string; phone: string }) => Promise<User>;
  /**
   * Guards an action that needs an account. Returns true when signed in; for guests it opens
   * a friendly sign-in prompt (that returns here afterwards) and returns false.
   */
  requireSignIn: (message: string, next?: string) => boolean;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<{ message: string; next: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ user: User | null }>('/auth/me')
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(user);
    return user;
  }, []);

  const register = useCallback<AuthApi['register']>(async (input) => {
    const { user } = await api<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    setUser(user);
    return user;
  }, []);

  const demoLogin = useCallback(async (account: DemoAccount) => {
    const { user } = await api<{ user: User }>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ account }) });
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthApi['updateProfile']>(async (input) => {
    const { user } = await api<{ user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) });
    setUser(user);
    return user;
  }, []);

  const requireSignIn = useCallback<AuthApi['requireSignIn']>(
    (message, next) => {
      if (user) return true;
      setPrompt({ message, next: next ?? pathname + search });
      return false;
    },
    [user, pathname, search],
  );

  const value = useMemo<AuthApi>(
    () => ({ user, loading, login, register, demoLogin, logout, updateProfile, requireSignIn }),
    [user, loading, login, register, demoLogin, logout, updateProfile, requireSignIn],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInPrompt open={!!prompt} message={prompt?.message ?? ''} next={prompt?.next ?? '/'} onClose={() => setPrompt(null)} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
