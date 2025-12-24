import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminUser, isSuperAdmin } from '@/lib/services/adminUserService'

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ABSOLUTE FIRST PRIORITY - BYPASS EVERYTHING FOR ADMIN LOGIN
  if (pathname === '/admin-panel/login') {
    console.log('[MIDDLEWARE] ✅ BYPASSING ALL CHECKS FOR ADMIN LOGIN')
    return NextResponse.next()
  }

  console.log('[MIDDLEWARE] Processing request:', pathname)

  // Skip proxy for static files and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/admin/verify-access') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    console.log('[MIDDLEWARE] Bypassing static asset:', pathname)
    return NextResponse.next()
  }

  // Always allow access to maintenance page
  if (pathname.startsWith('/maintenance')) {
    console.log('[MIDDLEWARE] Allowing access to maintenance page')
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check maintenance mode FIRST before auth checks
  try {
    const { data: maintenanceMode, error: maintenanceError } = await supabase
      .from('maintenance_mode')
      .select('is_enabled')
      .limit(1)
      .single()

    console.log('[PROXY] Maintenance mode check:', { 
      isEnabled: maintenanceMode?.is_enabled, 
      error: maintenanceError,
      pathname 
    })

    if (maintenanceMode?.is_enabled) {
      // Get user to check if admin
      const { data: { user } } = await supabase.auth.getUser()

      // Allow admin users to bypass maintenance mode
      const isAdmin = user?.email ? await isAdminUser(user.email) : false

      console.log('[PROXY] Maintenance mode active:', { 
        userEmail: user?.email, 
        isAdmin,
        pathname 
      })

      // Allow access to admin login page during maintenance
      if (pathname === '/admin-panel/login') {
        return response
      }

      // Allow authenticated admins to access admin panel during maintenance
      if (isAdmin && pathname.startsWith('/admin-panel')) {
        console.log('[PROXY] Admin accessing admin panel during maintenance')
        // Continue to normal admin panel auth checks below
      } else if (!isAdmin && !pathname.startsWith('/admin-panel')) {
        // Redirect non-admins to maintenance page
        console.log('[PROXY] Redirecting to maintenance page')
        const maintenanceUrl = new URL('/maintenance', request.url)
        return NextResponse.redirect(maintenanceUrl)
      } else if (!isAdmin && pathname.startsWith('/admin-panel') && pathname !== '/admin-panel/login') {
        // Non-admin trying to access admin panel - redirect to maintenance
        console.log('[PROXY] Non-admin trying to access admin panel during maintenance')
        const maintenanceUrl = new URL('/maintenance', request.url)
        return NextResponse.redirect(maintenanceUrl)
      }
    }
  } catch (error) {
    console.error('[PROXY] Maintenance mode check error:', error)
    // Continue on error to prevent site lockout
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow public access to homepage, auth pages, and static assets
  const publicPaths = [
    '/',
    '/homepage',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/verify',
    '/auth/callback', // OAuth callback
  ]

  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
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
      console.log('[PROXY] Email not verified - redirecting to verify page')
      return NextResponse.redirect(new URL('/auth/verify', request.url))
    }
    
    // Check if user has completed onboarding
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!preferences || prefsError) {
      console.log('[PROXY] Global onboarding check - redirecting to onboarding')
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Protect admin panel routes - require admin authentication
  if (request.nextUrl.pathname.startsWith('/admin-panel')) {
    // Allow access to admin login page without authentication
    if (request.nextUrl.pathname === '/admin-panel/login') {
      // If already authenticated and is admin, redirect to admin panel
      if (user) {
        const hasAdminAccess = user.email ? await isAdminUser(user.email) : false
        if (hasAdminAccess) {
          return NextResponse.redirect(new URL('/admin-panel', request.url))
        }
      }
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
      const redirectUrl = new URL('/auth/signin', request.url)
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

    console.log('[PROXY] Dashboard access check:', {
      userId: user.id,
      hasPreferences: !!preferences,
      error: prefsError?.code
    })

    if (!preferences || prefsError) {
      // Redirect to onboarding if not completed
      console.log('[PROXY] Redirecting to onboarding - no preferences found')
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return response
  }

  // Protect onboarding route - require authentication and email verification
  if (request.nextUrl.pathname === '/onboarding') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Check if email is verified (only for email/password users)
    const isOAuthUser = user.app_metadata?.provider !== 'email'
    const isEmailVerified = user.email_confirmed_at !== null
    
    if (!isOAuthUser && !isEmailVerified) {
      console.log('[PROXY] Onboarding access denied - email not verified')
      return NextResponse.redirect(new URL('/auth/verify', request.url))
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

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth') && user) {
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
