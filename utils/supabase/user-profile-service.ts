/**
 * User Profile Service
 * Provides type-safe methods for managing user profiles
 */
import { supabaseClient } from './supabase-client';
import type { UserProfile, UserProfileArray } from '@/types/supabase';

/**
 * User profile update parameters
 */
export interface UserProfileUpdateParams {
  readonly username?: string;
  readonly full_name?: string;
  readonly avatar_url?: string;
  readonly bio?: string;
  readonly wallet_address?: string;
}

/**
 * Response interface for profile operations
 */
export interface ProfileResponse<T = unknown> {
  readonly data: T | null;
  readonly error: Error | null;
}

/**
 * Get a user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<ProfileResponse<UserProfile>> {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
}

/**
 * Create a new user profile
 */
export async function createUserProfile(
  userId: string, 
  username: string, 
  walletAddress?: string
): Promise<ProfileResponse<UserProfile>> {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .insert({
      user_id: userId,
      username,
      wallet_address: walletAddress
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * Update a user profile
 */
export async function updateUserProfile(
  userId: string, 
  profile: UserProfileUpdateParams
): Promise<ProfileResponse<UserProfile>> {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .update(profile)
    .eq('user_id', userId)
    .select()
    .single();
  
  return { data, error };
}

/**
 * Link a wallet address to a user profile
 */
export async function linkWalletToProfile(
  userId: string, 
  walletAddress: string
): Promise<ProfileResponse<UserProfile>> {
  return updateUserProfile(userId, { wallet_address: walletAddress });
}

/**
 * Get profiles by wallet address
 */
export async function getProfilesByWallet(
  walletAddress: string
): Promise<ProfileResponse<UserProfileArray>> {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress);
  
  return { 
    data: data as UserProfileArray || [], 
    error 
  };
}
