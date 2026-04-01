'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In development, auto-login with a mock user after mount (avoids SSR mismatch)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setUser({ id: 'dev', name: 'Developer', email: 'dev@local', avatar: '', plan: 'Pro' });
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (_email: string, _password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual auth API call
      await new Promise((r) => setTimeout(r, 500));
      setUser(null); // No mock user — require real auth
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
