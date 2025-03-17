/**
 * Supabase client configuration
 * Exports a typed Supabase client for use throughout the application
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Environment Variables - these need to be added to your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Type-safe Supabase client instance
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
