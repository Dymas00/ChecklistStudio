import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import { User, LoginData, UserRole } from '@shared/schema';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: User | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
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
      
      // Navigate based on user role
      if (data.user.role === UserRole.TECNICO) {
        navigate('/technician');
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

  // Set up token in query client
  useEffect(() => {
    if (token) {
      queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          queryFn: async ({ queryKey }) => {
            const response = await fetch(queryKey.join("/") as string, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              credentials: "include",
            });
            
            if (response.status === 401) {
              logout();
              throw new Error('Unauthorized');
            }
            
            if (!response.ok) {
              const text = (await response.text()) || response.statusText;
              throw new Error(`${response.status}: ${text}`);
            }
            
            return await response.json();
          },
        },
      });
    }
  }, [token, queryClient]);

  const user = authData?.user || null;
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
        if (isTechnician) {
          navigate('/technician');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, isTechnician, navigate]);

  const value: AuthContextType = {
    user,
    login,
    logout,
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
