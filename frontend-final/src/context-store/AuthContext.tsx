import {
  createContext,
  useState,
  type ReactNode,
} from 'react';
import { api, data } from '../services/api';

export type Role = 'COLLECTOR' | 'RECYCLER' | 'ADMIN';

export interface AuthUser {
  role: Role;
  name: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  role: Role;
  name: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  login: (
    mobile: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext =
  createContext<AuthContextValue | null>(null);

function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem('kc_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem('kc_user');
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(
    () => getStoredUser(),
  );

  async function login(
    mobile: string,
    password: string,
  ): Promise<void> {
    const response = await data<TokenResponse>(
      api.post('/auth/login', {
        mobile,
        password,
      }),
    );

    const authenticatedUser: AuthUser = {
      role: response.role,
      name: response.name,
    };

    localStorage.setItem(
      'kc_access',
      response.accessToken,
    );
    localStorage.setItem(
      'kc_refresh',
      response.refreshToken,
    );
    localStorage.setItem(
      'kc_user',
      JSON.stringify(authenticatedUser),
    );

    setUser(authenticatedUser);
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {
        refreshToken:
          localStorage.getItem('kc_refresh'),
      });
    } catch {
      // Local auth state must still be cleared
      // when the server token/session is already invalid.
    } finally {
      localStorage.removeItem('kc_access');
      localStorage.removeItem('kc_refresh');
      localStorage.removeItem('kc_user');
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}