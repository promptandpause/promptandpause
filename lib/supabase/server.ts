import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Server Client for Server-Side Rendering
 * 
 * Use this in:
 * - Server Components
 * - Server Actions
 * - Route Handlers (API routes)
 * 
 * This handles cookies automatically for session management.
 */

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Cookie operations might fail in Server Components
            // This is expected and can be safely ignored
          }
        },
      },
    }
  )
}

/**
 * Supabase Service Role Client for Admin Operations
 * 
 * ⚠️ WARNING: This client bypasses RLS (Row Level Security).
 * Only use for server-side admin operations that require elevated permissions.
 * 
 * Use cases:
 * - Creating user profiles after signup
 * - System-level operations (cron jobs)
 * - Analytics/reporting that needs cross-user data
 * 
 * NEVER expose this client or its responses directly to the client.
 */

export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Helper to get the current user from server context
 * Returns null if not authenticated
 */

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Helper to require authentication in Server Components/Actions
 * Throws an error if user is not authenticated
 */

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
