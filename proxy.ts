import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminUser, isSuperAdmin } from '@/lib/services/adminUserService'

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // HTTP Strict Transport Security (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: https://www.googletagmanager.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://ipapi.co https://www.google-analytics.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')
  )
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self "https://js.stripe.com"), usb=()'
  )
  
  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  
  return response
}

/**
 * Check if pathname is a static asset
 */
function isStaticFile(pathname: string): boolean {
  const staticExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot', '.webp']
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIP = getClientIP(request)

  // Detect admin subdomain
  const hostname = request.headers.get('host') || ''
  const isAdminSubdomain = hostname.startsWith('admin.')

  // Skip proxy for static files and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/admin/verify-access') ||
    isStaticFile(pathname)
  ) {
    return NextResponse.next()
  }

  // Enhanced cookie settings for dashboard performance
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set x-pathname header for layouts to detect current route
  response.headers.set('x-pathname', pathname)

  if (pathname.startsWith('/dashboard')) {
    // Set performance cookies for dashboard routes
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

    // PWA specific headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Static assets caching
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/images')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Always allow access to maintenance page
  if (pathname.startsWith('/maintenance')) {
    return response
  }

  // RESTRICTION: Admin subdomain should only serve admin panel routes
  if (isAdminSubdomain && !pathname.startsWith('/admin-panel')) {
    // Redirect to admin panel root on admin subdomain
    return NextResponse.redirect(new URL('/admin-panel', request.url))
  }

  // RESTRICTION: Admin panel routes should only be accessible on admin subdomain
  if (!isAdminSubdomain && pathname.startsWith('/admin-panel')) {
    // Redirect to admin subdomain
    const adminUrl = new URL(request.url)
    adminUrl.hostname = `admin.${adminUrl.hostname}`
    return NextResponse.redirect(adminUrl)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Preserve x-pathname header
          response.headers.set('x-pathname', pathname)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Preserve x-pathname header
          response.headers.set('x-pathname', pathname)
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Apply security headers to all responses
  response = applySecurityHeaders(response)

  // BYPASS maintenance mode check for admin subdomain
  // Admin panel on admin subdomain is always accessible regardless of maintenance mode
  if (!isAdminSubdomain) {
    // Check maintenance mode FIRST before auth checks (only for main domain)
    try {
      const { data: maintenanceMode, error: maintenanceError } = await supabase
        .from('maintenance_mode')
        .select('is_enabled')
        .limit(1)
        .single()
      if (maintenanceMode?.is_enabled) {
        // Get user to check if admin
        const { data: { user } } = await supabase.auth.getUser()

        // Allow admin users to bypass maintenance mode on main domain
        const isAdmin = user?.email ? await isAdminUser(user.email) : false
        // Allow access to admin login page during maintenance
        if (pathname === '/admin-panel/login') {
          return response
        }

        // Allow authenticated admins to access admin panel during maintenance
        if (isAdmin && pathname.startsWith('/admin-panel')) {
          // Continue to normal admin panel auth checks below
        } else if (!isAdmin && !pathname.startsWith('/admin-panel')) {
          // Redirect non-admins to maintenance page
          const maintenanceUrl = new URL('/maintenance', request.url)
          return NextResponse.redirect(maintenanceUrl)
        } else if (!isAdmin && pathname.startsWith('/admin-panel') && pathname !== '/admin-panel/login') {
          // Non-admin trying to access admin panel - redirect to maintenance
          const maintenanceUrl = new URL('/maintenance', request.url)
          return NextResponse.redirect(maintenanceUrl)
        }
      }
    } catch (error) {
      // Continue on error to prevent site lockout
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow public access to homepage, auth pages, and static assets
  const publicPaths = [
    '/',
    '/homepage',
    '/login',
    '/signup',
    '/forgot-password',
    '/verify',
    '/change-password',
    '/auth',
    '/auth/callback', // OAuth callback
  ]

  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  )
  const isStaticAsset =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.')

  // Allow access to public paths and static assets
  if (isPublicPath || isStaticAsset) {
    return response
  }

  // GLOBAL CHECK: Authenticated users must verify email (if email/password) and complete onboarding
  // Exception: Allow access to /onboarding and /admin-panel routes
  if (user && 
      !request.nextUrl.pathname.startsWith('/onboarding') && 
      !request.nextUrl.pathname.startsWith('/admin-panel')) {
    
    // Check if email is verified (only required for email/password signups, not OAuth)
    // OAuth providers (Google, etc.) already verify emails
    const isOAuthUser = user.app_metadata?.provider !== 'email'
    const isEmailVerified = user.email_confirmed_at !== null
    
    if (!isOAuthUser && !isEmailVerified) {
      return NextResponse.redirect(new URL('/verify', request.url))
    }
    
    // Check if user has completed onboarding
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!preferences || prefsError) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Protect admin panel routes - require admin authentication
  if (request.nextUrl.pathname.startsWith('/admin-panel')) {
    // Allow access to admin login page without authentication
    if (request.nextUrl.pathname === '/admin-panel/login') {
      // Just return response - don't redirect authenticated users
      // The login page component will handle redirecting authenticated admins
      return response
    }

    if (!user) {
      const redirectUrl = new URL('/admin-panel/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has admin access
    const hasAdminAccess = user.email ? await isAdminUser(user.email) : false
    if (!hasAdminAccess) {
      // Not an admin - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Check for super admin only routes
    if (request.nextUrl.pathname.startsWith('/admin-panel/settings')) {
      const isSuperAdminUser = user.email ? await isSuperAdmin(user.email) : false
      if (!isSuperAdminUser) {
        // Not a super admin - redirect to admin panel home
        return NextResponse.redirect(new URL('/admin-panel', request.url))
      }
    }

    return response
  }

  // Protect dashboard routes - require authentication AND completed onboarding
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // CRITICAL: Check if user has completed onboarding
    // User MUST have preferences record to access dashboard
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!preferences || prefsError) {
      // Redirect to onboarding if not completed
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return response
  }

  // Protect onboarding route - require authentication and email verification
  if (request.nextUrl.pathname === '/onboarding') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if email is verified (only for email/password users)
    const isOAuthUser = user.app_metadata?.provider !== 'email'
    const isEmailVerified = user.email_confirmed_at !== null
    
    if (!isOAuthUser && !isEmailVerified) {
      return NextResponse.redirect(new URL('/verify', request.url))
    }

    // If user has already completed onboarding, redirect to dashboard
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (preferences) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  }

  // Redirect authenticated users away from auth landing pages
  if ((request.nextUrl.pathname === '/auth' || request.nextUrl.pathname === '/login') && user) {
    // Check if they've completed onboarding
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!preferences) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
