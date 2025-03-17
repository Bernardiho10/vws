/**
 * Supabase Database Types
 * Generated types for the Supabase schema
 */

/**
 * User profile information
 */
export interface UserProfile {
  readonly id: string;
  readonly user_id: string;
  readonly username: string;
  readonly full_name?: string;
  readonly avatar_url?: string;
  readonly bio?: string;
  readonly wallet_address?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Array type for user profiles
 */
export type UserProfileArray = readonly UserProfile[];

/**
 * Voter verification status
 */
export type VerificationStatus = 'unverified' | 'pending' | 'verified';

/**
 * User verification information
 */
export interface UserVerification {
  readonly id: string;
  readonly user_id: string;
  readonly status: VerificationStatus;
  readonly verification_method: string;
  readonly verification_data: Record<string, unknown>;
  readonly verified_at?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * User voting preferences
 */
export interface UserPreferences {
  readonly id: string;
  readonly user_id: string;
  readonly notification_email: boolean;
  readonly notification_push: boolean;
  readonly delegate_address?: string;
  readonly delegation_expiry?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Database schema definition
 */
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_verifications: {
        Row: UserVerification;
        Insert: Omit<UserVerification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserVerification, 'id' | 'created_at' | 'updated_at' | 'verified_at'>>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      verification_status: VerificationStatus;
    };
  };
}
