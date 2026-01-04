import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Enhanced cookie settings for dashboard performance
  if (pathname.startsWith('/dashboard')) {
    // Set secure cookies for dashboard routes
    const supabase = createClient()
    
    // Performance cookies
    response.cookies.set('dashboard_loaded', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/dashboard'
    })

    // Theme preference cookie
    response.cookies.set('theme_preference', 'system', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 30, // 30 days
      path: '/'
    })

    // User session cookie for faster loading
    response.cookies.set('user_session_active', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1800, // 30 minutes
      path: '/dashboard'
    })
  }

  // PWA specific headers
  if (pathname.startsWith('/dashboard') || pathname === '/') {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Static assets caching
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/images')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
