import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import { UserRole } from '@shared/schema';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  cpf?: string;
  contractor?: string;
  active: boolean;
  createdAt: Date;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('token')
  );

  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['/api/auth/me'], data);
      
      // Navigate based on user role - technicians to checklists
      if (data.user.role === UserRole.TECNICO) {
        navigate('/checklists');
      } else {
        navigate('/dashboard');
      }
    },
  });

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    queryClient.clear();
    navigate('/login');
  };

  const login = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  };

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  };

  // Monitor token validity
  useEffect(() => {
    // Clear invalid tokens on load
    if (token && authData === null) {
      setToken(null);
      localStorage.removeItem('token');
    }
  }, [token, authData]);

  const user = (authData as any)?.user || null;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;
  const isTechnician = user?.role === UserRole.TECNICO;

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const currentPath = window.location.pathname;
      
      if (!isAuthenticated && currentPath !== '/login' && currentPath !== '/') {
        navigate('/login');
      } else if (isAuthenticated && (currentPath === '/login' || currentPath === '/')) {
        // Always redirect to /checklists for technicians, /dashboard for others
        const targetPath = isTechnician ? '/checklists' : '/dashboard';
        navigate(targetPath);
      }
    }
  }, [isAuthenticated, isLoading, isTechnician, navigate]);

  const value: AuthContextType = {
    user,
    login,
    logout,
    refreshUser,
    isLoading,
    isAuthenticated,
    isAdmin,
    isTechnician,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Simple auth utility for token management
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}