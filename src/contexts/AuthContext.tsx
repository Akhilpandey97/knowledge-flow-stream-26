import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, User> = {
  'john.doe@company.com': {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'exiting',
    department: 'Sales',
    avatar: ''
  },
  'sarah.wilson@company.com': {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    role: 'successor',
    department: 'Sales',
    avatar: ''
  },
  'hr@company.com': {
    id: '3',
    name: 'Emily Chen',
    email: 'hr@company.com',
    role: 'hr-manager',
    department: 'Human Resources',
    avatar: ''
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock authentication
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && password === 'demo123') {
      setUser(mockUser);
      localStorage.setItem('auth-user', JSON.stringify(mockUser));
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};