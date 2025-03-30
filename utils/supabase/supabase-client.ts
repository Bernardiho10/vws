/**
 * Supabase client configuration
 * Exports a typed Supabase client for use throughout the application
 */
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

// Environment Variables - these need to be added to your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Type-safe Supabase client instance
 */
export const supabaseClient = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
