'use client';

import React from 'react';

//-----------------------------------------------------------------------------------------------

const TOKEN_KEY = 'token';
const TOKEN_EXPIRE_KEY = 'token_expire';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Helper to get token if not expired
  const getValidToken = () => {
    if (typeof window === 'undefined') return null;
    const expire = localStorage.getItem(TOKEN_EXPIRE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (expire && token) {
      if (Date.now() < Number(expire)) {
        return token;
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRE_KEY);
        return null;
      }
    }
    return null;
  };

  const [token, setTokenState] = React.useState<string | null>(getValidToken());

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      // 30 days in ms
      localStorage.setItem(TOKEN_EXPIRE_KEY, (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRE_KEY);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
