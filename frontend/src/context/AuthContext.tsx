import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          removeAuthToken();
          setToken(null);
        }
      } catch (err) {
        removeAuthToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    if (res.success && res.token && res.user) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (userData: any) => {
    const res = await api.register(userData);
    if (res.success && res.token && res.user) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (targetRole: Role) => {
    let email = 'admin@brightloop.io';
    let password = 'Admin@Brightloop123';

    if (targetRole === 'STAFF') {
      email = 'staff@brightloop.io';
      password = 'Staff@Brightloop123';
    } else if (targetRole === 'CUSTOMER') {
      email = 'apex@enterprise.com';
      password = 'Customer@Brightloop123';
    }

    await login({ email, password });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
