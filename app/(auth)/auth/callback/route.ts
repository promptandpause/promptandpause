import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getIPFromRequest, getGeoDataFromIP, logUserIP } from '@/lib/services/ipLoggingService'

/**
 * Queue a welcome email the first time a user lands post-auth. Handles both
 * email/password signups and SSO/OAuth first logins. Idempotent — guarded
 * against re-queueing or re-sending via email_queue + email_logs checks.
 * Never blocks the auth redirect on failure.
 */
async function queueWelcomeEmailOnce(userId: string, email: string | null, displayName: string) {
  if (!email) return
  try {
    const service = createServiceRoleClient()

    const { data: alreadySent } = await service
      .from('email_logs')
      .select('id')
      .eq('recipient_email', email)
      .eq('template_name', 'welcome')
      .in('status', ['sent', 'delivered', 'opened', 'clicked'])
      .limit(1)
      .maybeSingle()
    if (alreadySent) return

    const { data: alreadyQueued } = await service
      .from('email_queue')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', 'welcome')
      .in('status', ['pending', 'sent'])
      .limit(1)
      .maybeSingle()
    if (alreadyQueued) return

    await service.from('email_queue').insert({
      user_id: userId,
      email_type: 'welcome',
      recipient_email: email,
      recipient_name: displayName,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Non-blocking: auth flow must continue even if queueing fails.
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next')
  const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : null
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Log IP address and location on auth callback
      try {
        const ip = getIPFromRequest(request)
        const geoData = await getGeoDataFromIP(ip)
        const userAgent = request.headers.get('user-agent') || undefined
        
        await logUserIP({
          user_id: user.id,
          ip_address: ip,
          country: geoData?.country,
          city: geoData?.city,
          timezone: geoData?.timezone,
          user_agent: userAgent,
          event_type: 'login', // Could be signup or login
        })
      } catch (ipError) {
        console.error('IP logging failed:', ipError)
        // Don't block auth flow if IP logging fails
      }

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      // First-time landing (no preferences row yet): queue a welcome email.
      // Works for email/password signups AND SSO/OAuth first logins. The
      // helper is idempotent so repeated callbacks won't duplicate sends.
      if (!preferences) {
        const displayName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split('@')[0] ||
          'there'
        await queueWelcomeEmailOnce(user.id, user.email ?? null, displayName)
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${safeNext || '/dashboard'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
