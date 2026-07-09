import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getIPFromRequest, getGeoDataFromIP, logUserIP } from '@/lib/services/ipLoggingService'
import { sendNewDeviceSignInEmail } from '@/lib/services/emailService'

/**
 * Coarse user-agent "family" used for new-device detection. Matches the
 * granularity of `describeUserAgent` in emailService (browser + OS) so a
 * user switching Chrome on Windows → Chrome on iOS is correctly flagged as
 * a new device, while multiple logins from Chrome on the same OS are not.
 */
function uaFamily(ua: string | null | undefined): string {
  if (!ua) return 'unknown'
  const lower = ua.toLowerCase()
  const browser =
    lower.includes('edg/') ? 'edge' :
    lower.includes('firefox/') ? 'firefox' :
    lower.includes('chrome/') ? 'chrome' :
    lower.includes('safari/') ? 'safari' :
    lower.includes('opera') || lower.includes('opr/') ? 'opera' :
    'other'
  const os =
    lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios') ? 'ios' :
    lower.includes('android') ? 'android' :
    lower.includes('mac os') || lower.includes('macintosh') ? 'mac' :
    lower.includes('windows') ? 'windows' :
    lower.includes('linux') ? 'linux' :
    'other'
  return `${browser}:${os}`
}

/**
 * Detect whether this sign-in is from a device/location we've never seen for
 * this user, and if so fire a security email inline. Non-blocking — any
 * failure is swallowed so the auth redirect is never delayed.
 *
 * Uses the existing `ip_logs` table as the history source (no new table
 * needed). "New device" = never-before-seen (country + UA family) tuple for
 * this user. Also suppresses duplicate emails via a 30-day `email_logs`
 * lookback so we don't spam a user who travels, comes back, travels again.
 */
async function detectAndNotifyNewDevice(params: {
  userId: string
  email: string | null
  displayName: string
  country: string | null
  city: string | null
  userAgent: string | null
  signedInAt: string
}) {
  if (!params.email) return
  try {
    const service = createServiceRoleClient()
    const family = uaFamily(params.userAgent)
    const country = params.country || 'unknown'

    // History check: have we seen this (country, ua-family) before for
    // this user? We pull a compact sample and match in JS so we don't need
    // to store a derived `ua_family` column on ip_logs.
    const { data: history } = await service
      .from('ip_logs')
      .select('country, user_agent, logged_at')
      .eq('user_id', params.userId)
      .order('logged_at', { ascending: false })
      .limit(50)

    const seenBefore = (history ?? []).some((row) => {
      const sameCountry = (row.country || 'unknown') === country
      const sameFamily = uaFamily(row.user_agent as string | null) === family
      return sameCountry && sameFamily
    })

    if (seenBefore) return

    // Rate-limit: at most one new-device email per 30 days per recipient.
    // Travel patterns shouldn't generate a flurry of security emails.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentSend } = await service
      .from('email_logs')
      .select('id')
      .eq('recipient_email', params.email)
      .eq('template_name', 'new_device_sign_in')
      .gte('created_at', thirtyDaysAgo)
      .limit(1)
      .maybeSingle()

    if (recentSend) return

    await sendNewDeviceSignInEmail(
      params.email,
      params.displayName,
      {
        country: params.country,
        city: params.city,
        userAgent: params.userAgent,
        signedInAt: params.signedInAt,
      },
      params.userId,
    )
  } catch {
    // Security email must never block the auth redirect.
  }
}

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
  const type = requestUrl.searchParams.get('type')

  const isRecovery = type === 'recovery'

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/#mode=signin`)
    }

    if (isRecovery) {
      return NextResponse.redirect(`${origin}/#mode=change-password`)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Log IP + detect new device. The detection check MUST run before
      // `logUserIP` inserts this session's row, otherwise every login would
      // appear as an already-seen device.
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split('@')[0] ||
        'there'

      try {
        const ip = getIPFromRequest(request)
        const geoData = await getGeoDataFromIP(ip)
        const userAgent = request.headers.get('user-agent') || undefined
        const signedInAt = new Date().toISOString()

        // Security email: fire-and-forget, before we insert the new ip_logs
        // row so the history comparison is against prior sessions only.
        detectAndNotifyNewDevice({
          userId: user.id,
          email: user.email ?? null,
          displayName,
          country: geoData?.country ?? null,
          city: geoData?.city ?? null,
          userAgent: userAgent ?? null,
          signedInAt,
        }).catch(() => {})

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

      // Self-healing welcome-email queue. Runs on EVERY callback, not only
      // first-time landings — `queueWelcomeEmailOnce` already short-circuits
      // via email_logs + email_queue lookups, so repeated callbacks are a
      // no-op. This matters because existing SSO users signed up before the
      // queueing code existed; without this, they'd never receive a welcome
      // email. Now they get one the very next time they sign in.
      // (`displayName` is declared above alongside the new-device detection.)
      await queueWelcomeEmailOnce(user.id, user.email ?? null, displayName)

      if (!preferences) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${safeNext || '/dashboard'}`)
    }
  }

  return NextResponse.redirect(`${origin}/#mode=signin`)
}
