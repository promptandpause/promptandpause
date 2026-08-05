import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase/server'

/**
 * Admin auth for the OTP-based login flow.
 *
 * OTP logins issue an httpOnly `admin_session` cookie containing a random
 * token whose sha256 hash is stored in the `admin_sessions` table. This
 * module validates that cookie so server layouts, API routes and the client
 * guard can all share one source of truth.
 */

/**
 * Validate the `admin_session` cookie against the `admin_sessions` table.
 * Returns the session row (with the joined admin user) or null.
 * Expired sessions are deleted as a side effect.
 *
 * Pass an explicit token when running outside a request scope (e.g. the
 * edge proxy), where `cookies()` from `next/headers` is not available.
 */
export async function getAdminSession(explicitToken?: string) {
  let sessionToken = explicitToken

  if (sessionToken === undefined) {
    const cookieStore = await cookies()
    sessionToken = cookieStore.get('admin_session')?.value
  }

  if (!sessionToken) {
    return null
  }

  const supabase = createServiceRoleClient()
  const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*, admin_users!inner(id, email, full_name, role, is_active)')
    .eq('session_token', sessionHash)
    .single()

  if (error || !session) {
    return null
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('admin_sessions').delete().eq('id', session.id)
    return null
  }

  // Check if admin user is still active
  if (!session.admin_users.is_active) {
    return null
  }

  return session
}

/**
 * Resolve the current admin identity for admin API routes.
 * An OTP `admin_session` cookie takes precedence (matching the admin layout),
 * falling back to the Supabase auth session for password logins.
 */
export async function getAdminUser() {
  const otpSession = await getAdminSession()
  if (otpSession) {
    const admin = otpSession.admin_users
    return {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      is_otp_session: true,
    }
  }

  return getAuthUser()
}
