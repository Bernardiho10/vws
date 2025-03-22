"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  signIn, 
  signOut, 
  signUp, 
  getSession, 
  getCurrentUser, 
  signInWithWallet,
  type SignInCredentials,
  type SignUpCredentials
} from '@/utils/supabase/auth-service';
import { 
  getUserProfile, 
  createUserProfile, 
  linkWalletToProfile,
  updateUserProfile,
  type UserProfileUpdateParams 
} from '@/utils/supabase/user-profile-service';
import type { UserProfile } from '@/types/supabase';

/**
 * Authentication state interface
 */
interface AuthState {
  readonly user: User | null;
  readonly profile: UserProfile | null;
  readonly loading: boolean;
  readonly error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
};

/**
 * Authentication context interface
 */
interface AuthContextType {
  readonly authState: AuthState;
  readonly signUpWithEmail: (credentials: SignUpCredentials) => Promise<void>;
  readonly signInWithEmail: (credentials: SignInCredentials) => Promise<void>;
  readonly connectWithWallet: (walletAddress: string, signature: string) => Promise<void>;
  readonly updateProfile: (profileData: UserProfileUpdateParams) => Promise<void>;
  readonly linkWallet: (walletAddress: string) => Promise<void>;
  readonly logout: () => Promise<void>;
  
  // Backward compatibility properties for existing components
  readonly user: string | null;
  readonly login: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Client-side only detection
  const [mounted, setMounted] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Set mounted flag after initial render
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  /**
   * Initialize authentication state from session
   */
  const initializeAuth = useCallback(async (): Promise<void> => {
    if (!mounted) return;
    
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const sessionResponse = await getSession();
      
      if (sessionResponse.error) {
        throw sessionResponse.error;
      }

      if (sessionResponse.data) {
        const userResponse = await getCurrentUser();
        if (userResponse.error) {
          throw userResponse.error;
        }

        if (userResponse.data) {
          const profileResponse = await getUserProfile(userResponse.data.id);
          setAuthState({
            user: userResponse.data,
            profile: profileResponse.data,
            loading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      } else {
        setAuthState(initialState);
      }
    } catch (error) {
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error during auth initialization'
      });
    }
  }, [mounted]);

  // Initialize auth after component mounts on client
  useEffect(() => {
    if (mounted) {
      initializeAuth();
    }
  }, [initializeAuth, mounted]);

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = useCallback(async (credentials: SignUpCredentials): Promise<void> => {
    if (!mounted) return;
    
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const signUpResponse = await signUp(credentials);
      if (signUpResponse.error) {
        throw signUpResponse.error;
      }

      const userData = signUpResponse.data?.user;
      if (userData) {
        const profileResponse = await createUserProfile(
          userData.id,
          credentials.username
        );

        if (profileResponse.error) {
          throw profileResponse.error;
        }

        setAuthState({
          user: userData,
          profile: profileResponse.data,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error during sign up'
      }));
    }
  }, [mounted]);

  /**
   * Sign in with email and password
   */
  const signInWithEmail = useCallback(async (credentials: SignInCredentials): Promise<void> => {
    if (!mounted) return;
    
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const signInResponse = await signIn(credentials);
      if (signInResponse.error) {
        console.error('Error during sign in:', signInResponse.error);
        throw signInResponse.error;
      }

      const userData = signInResponse.data?.user;
      if (userData) {
        const profileResponse = await getUserProfile(userData.id);
        if (profileResponse.error) {
          throw profileResponse.error;
        }

        setAuthState({
          user: userData,
          profile: profileResponse.data,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error during sign in'
      }));
    }
  }, [mounted]);

  /**
   * Connect with wallet address and signature
   */
  const connectWithWallet = useCallback(async (walletAddress: string, signature: string): Promise<void> => {
    if (!mounted) return;
    
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const walletSignInResponse = await signInWithWallet(walletAddress, signature);
      if (walletSignInResponse.error) {
        throw walletSignInResponse.error;
      }

      const userData = walletSignInResponse.data?.user;
      if (userData) {
        const profileResponse = await getUserProfile(userData.id);
        
        // If no profile exists, create a new one with the wallet address
        if (!profileResponse.data) {
          const username = `user_${walletAddress.substring(2, 8)}`;
          const newProfileResponse = await createUserProfile(
            userData.id,
            username,
            walletAddress
          );

          if (newProfileResponse.error) {
            throw newProfileResponse.error;
          }

          setAuthState({
            user: userData,
            profile: newProfileResponse.data,
            loading: false,
            error: null
          });
        } else {
          // If profile exists but no wallet is linked, link it
          let updatedProfile = profileResponse.data;
          
          if (!profileResponse.data.wallet_address) {
            const linkResponse = await linkWalletToProfile(
              userData.id,
              walletAddress
            );
            
            if (linkResponse.error) {
              throw linkResponse.error;
            }
            
            updatedProfile = linkResponse.data || profileResponse.data;
          }

          setAuthState({
            user: userData,
            profile: updatedProfile,
            loading: false,
            error: null
          });
        }
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error during wallet connection'
      }));
    }
  }, [mounted]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData: UserProfileUpdateParams): Promise<void> => {
    if (!mounted || !authState.user) {
      if (!authState.user) {
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Cannot update profile when not logged in'
        }));
      }
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await updateUserProfile(authState.user.id, profileData);
      if (response.error) {
        throw response.error;
      }

      setAuthState(prev => ({
        ...prev,
        profile: response.data,
        loading: false,
        error: null
      }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error during profile update'
      }));
    }
  }, [authState.user, mounted]);

  /**
   * Link wallet address to profile
   */
  const linkWallet = useCallback(async (walletAddress: string): Promise<void> => {
    if (!mounted || !authState.user) {
      if (!authState.user) {
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Cannot link wallet when not logged in'
        }));
      }
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await linkWalletToProfile(authState.user.id, walletAddress);
      if (response.error) {
        throw response.error;
      }

      setAuthState(prev => ({
        ...prev,
        profile: response.data,
        loading: false,
        error: null
      }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error during wallet linking'
      }));
    }
  }, [authState.user, mounted]);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    if (!mounted) return;
    
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await signOut();
      if (response.error) {
        throw response.error;
      }

      setAuthState(initialState);
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error during logout'
      }));
    }
  }, [mounted]);

  /**
   * Legacy login function for backward compatibility
   */
  const login = useCallback((username: string): void => {
    // This is a simplified version just for backward compatibility
    console.warn('Using deprecated login method. Please update to use signInWithEmail or connectWithWallet.');
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', username);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AuthContextType>(() => ({
    authState,
    signUpWithEmail,
    signInWithEmail,
    connectWithWallet,
    updateProfile,
    linkWallet,
    logout,
    // Legacy properties for backward compatibility
    user: authState.profile?.username || null,
    login
  }), [
    authState,
    signUpWithEmail,
    signInWithEmail,
    connectWithWallet,
    updateProfile,
    linkWallet,
    logout,
    login
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook for accessing the authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};        