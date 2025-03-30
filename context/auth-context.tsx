"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { signIn, signUp, signOut, getSession, signInWithOAuth, AuthError } from '@/utils/supabase/auth-service';
import { supabaseClient } from '@/utils/supabase/supabase-client';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
}

export interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<{ data: User | null; error: AuthError | null }>;
  signup: (email: string, password: string, username?: string) => Promise<{ data: User | null; error: AuthError | null }>;
  logout: () => Promise<{ error: AuthError | null }>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: user, error } = await getSession();
      setAuthState(prev => ({
        ...prev,
        user,
        error,
        isLoading: false,
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error as AuthError,
        isLoading: false,
      }));
    }
  }

  const login = async (email: string, password: string) => {
    const result = await signIn({ email, password });
    if (result.data) {
      setAuthState(prev => ({
        ...prev,
        user: result.data,
        error: null,
      }));
    }
    return result;
  };

  const signup = async (email: string, password: string, username?: string) => {
    const result = await signUp({ email, password, username });
    if (result.data) {
      setAuthState(prev => ({
        ...prev,
        user: result.data,
        error: null,
      }));
    }
    return result;
  };

  const logout = async () => {
    const result = await signOut();
    if (!result.error) {
      setAuthState(prev => ({
        ...prev,
        user: null,
        error: null,
      }));
    }
    return result;
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    const result = await signInWithOAuth({ provider });
    return result;
  };

  const value = {
    authState,
    login,
    signup,
    logout,
    loginWithOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}        