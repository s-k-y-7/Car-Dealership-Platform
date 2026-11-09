import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  demoLogin: (role: UserRole) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get<User>('/auth/me/');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch {
          setUser(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const res = await api.post('/auth/token/', { username, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    
    const userRes = await api.get<User>('/auth/me/');
    setUser(userRes.data);
    localStorage.setItem('user', JSON.stringify(userRes.data));
    return userRes.data;
  };

  const demoLogin = async (role: UserRole): Promise<User> => {
    if (role === 'ADMIN') {
      return login('admin', 'admin123');
    } else if (role === 'CONSULTANT') {
      return login('rohit.verma', 'consultant123');
    } else {
      return login('ananya.dixit', 'buyer123');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        demoLogin,
        logout,
        isAuthenticated: !!user,
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
