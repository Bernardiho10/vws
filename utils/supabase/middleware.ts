import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in middleware
 * @param request NextRequest object from middleware
 * @returns Supabase client and response object
 */
export function createClient(request: NextRequest) {
  // Create a cookies container from the request
  const cookieStore = cookies()

  // Create a new Supabase client for server-side operations
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  return { supabase, response: NextResponse.next() }
}
