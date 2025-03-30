/**
 * Authentication service for Supabase integration
 * Provides type-safe methods for user authentication operations
 */
import { supabaseClient } from './supabase-client';
import { User } from '@supabase/supabase-js';

/**
 * Authentication response interface
 */
export interface AuthResponse<T = unknown> {
  data: T | null;
  error: Error | null;
}

/**
 * SignUp credentials interface
 */
export interface SignUpData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * SignIn credentials interface
 */
export interface SignInData {
  email: string;
  password: string;
}

/**
 * Register a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<{ data: User | null; error: AuthError | null }> {
  try {
    console.log('Attempting to sign up user:', data.email);
    const { data: authData, error } = await supabaseClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return { data: null, error: { ...error, message: error.message } };
    }

    console.log('Signup successful:', authData.user?.email);
    return { data: authData.user, error: null };
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return {
      data: null,
      error: {
        name: 'SignUpError',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during sign up',
      },
    };
  }
}

/**
 * Sign in a user with email and password
 */
export async function signIn({ email, password }: { email: string; password: string }): Promise<{ data: User | null; error: AuthError | null }> {
  try {
    console.log('Attempting to sign in user:', email);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Signin error:', error);
      return { data: null, error: { ...error, message: error.message } };
    }

    console.log('Signin successful:', data.user.email);
    return { data: data.user, error: null };
  } catch (error) {
    console.error('Unexpected error during signin:', error);
    return {
      data: null,
      error: {
        name: 'SignInError',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during sign in',
      },
    };
  }
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
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    console.log('Attempting to sign out user');
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error('Signout error:', error);
      return { error: { ...error, message: error.message } };
    }

    console.log('Signout successful');
    return { error: null };
  } catch (error) {
    console.error('Unexpected error during signout:', error);
    return {
      error: {
        name: 'SignOutError',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during sign out',
      },
    };
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<{ data: User | null; error: AuthError | null }> {
  try {
    console.log('Checking current session');
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error('Session check error:', error);
      return { data: null, error: { ...error, message: error.message } };
    }

    if (!session) {
      console.log('No active session found');
      return { data: null, error: null };
    }

    console.log('Active session found for:', session.user.email);
    return { data: session.user, error: null };
  } catch (error) {
    console.error('Unexpected error during session check:', error);
    return {
      data: null,
      error: {
        name: 'SessionError',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while checking session',
      },
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<{ data: User | null; error: AuthError | null }> {
  try {
    console.log('Fetching current user');
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return { data: null, error: { ...error, message: error.message } };
    }

    if (!data.user) {
      console.log('No user found');
      return { data: null, error: null };
    }

    console.log('User found:', data.user.email);
    return { data: data.user, error: null };
  } catch (error) {
    console.error('Unexpected error while fetching user:', error);
    return {
      data: null,
      error: {
        name: 'GetUserError',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while fetching user',
      },
    };
  }
}

/**
 * Sign in with OAuth provider
 * @param provider OAuth provider (google or facebook)
 * @returns Supabase auth response
 */
export async function signInWithOAuth({ provider }: { provider: 'google' | 'github' }): Promise<{ error: AuthError | null }> {
  try {
    console.log('Attempting OAuth signin with provider:', provider);
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('OAuth signin error:', error);
      return { error: { ...error, message: error.message } };
    }

    console.log('OAuth signin initiated successfully');
    return { error: null };
  } catch (error) {
    console.error('Unexpected error during OAuth signin:', error);
    return {
      error: {
        name: 'OAuthError',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during OAuth sign in',
      },
    };
  }
}

/**
 * Check if the user's email is verified
 * @returns boolean indicating verification status
 */
export async function verifyEmail(): Promise<{ error: AuthError | null }> {
  try {
    console.log('Checking email verification status');
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      console.error('No user found for email verification');
      return {
        error: {
          name: 'VerificationError',
          message: 'No user found',
        },
      };
    }

    if (user.email_confirmed_at) {
      console.log('Email already verified');
      return { error: null };
    }

    console.error('Email not verified');
    return {
      error: {
        name: 'VerificationError',
        message: 'Email not verified',
      },
    };
  } catch (error) {
    console.error('Unexpected error during email verification:', error);
    return {
      error: {
        name: 'VerificationError',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during email verification',
      },
    };
  }
}

/**
 * Check if the current user's email is verified
 */
export async function checkVerificationStatus(): Promise<boolean> {
  try {
    console.log('Checking email verification status');
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error) {
      console.error('Verification check error:', error);
      throw error;
    }

    if (!user) {
      console.log('No user found during verification check');
      return false;
    }

    const isVerified = user.email_confirmed_at != null;
    console.log('Email verification status:', isVerified);
    return isVerified;
  } catch (error) {
    console.error('Unexpected error during verification check:', error);
    throw error;
  }
}

export interface AuthError {
  name: string;
  message: string;
  status?: number;
  code?: string;
}
