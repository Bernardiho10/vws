/**
 * Authentication service for Supabase integration
 * Provides type-safe methods for user authentication operations
 */
import { supabaseClient } from './supabase-client';

/**
 * SignUp credentials interface
 */
export interface SignUpCredentials {
  readonly email: string;
  readonly password: string;
  readonly username: string;
}

/**
 * SignIn credentials interface
 */
export interface SignInCredentials {
  readonly email: string;
  readonly password: string;
}

/**
 * Authentication response interface
 */
export interface AuthResponse<T = unknown> {
  readonly data: T | null;
  readonly error: Error | null;
}

/**
 * Register a new user with email and password
 */
export async function signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
  const { email, password, username } = credentials;
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });
  return { data, error };
}

/**
 * Sign in a user with email and password
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  const { email, password } = credentials;
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

/**
 * Sign in a user with their wallet
 */
export async function signInWithWallet(walletAddress: string, signature: string): Promise<AuthResponse> {
  // This is simplified - in a real implementation, you would verify the signature
  // and use Supabase's custom JWT auth or OAuth
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: `${walletAddress}@wallet.auth`,
    password: signature.slice(0, 20) // This is just a placeholder for demo purposes
  });
  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  const { error } = await supabaseClient.auth.signOut();
  return { data: null, error };
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<AuthResponse> {
  const { data, error } = await supabaseClient.auth.getSession();
  return { data: data?.session || null, error };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  const { data, error } = await supabaseClient.auth.getUser();
  return { data: data?.user || null, error };
}

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @returns Supabase auth response
 */
export const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return { data, error: null };
};

/**
 * Sign in with OAuth provider
 * @param provider OAuth provider (google or facebook)
 * @returns Supabase auth response
 */
export const signInWithOAuth = async (provider: 'google' | 'facebook'): Promise<AuthResponse> => {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return { data, error: null };
};

/**
 * Check if the user's email is verified
 * @returns boolean indicating verification status
 */
export const checkVerificationStatus = async (): Promise<boolean> => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user?.email_confirmed_at !== null;
};
