import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/verify-email', '/auth/callback']

/**
 * Middleware to handle authentication checks and redirects
 * Protects routes from unauthorized access and redirects users based on auth status
 */
export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client for the middleware
    const { supabase, response } = createClient(request)

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()

    // Get the pathname
    const { pathname } = request.nextUrl
    
    // Allow public routes without authentication
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return response
    }

    // If no session and not on a public route, redirect to login
    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If there's a session but the email is not verified
    if (session?.user && !session.user.email_confirmed_at) {
      // If not already on the verify email page, redirect there
      if (pathname !== '/verify-email') {
        const redirectUrl = new URL('/verify-email', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Continue with the request
    return response
  } catch (e) {
    // On error, allow the request to continue
    return NextResponse.next()
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except static files, api routes, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
