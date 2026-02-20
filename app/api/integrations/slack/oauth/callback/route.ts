import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Slack OAuth Callback
 * 
 * GET /api/integrations/slack/oauth/callback?code=...&state=...
 * 
 * Handles the OAuth callback from Slack after user authorizes the app.
 * Exchanges the code for an access token and webhook URL, then saves to user preferences.
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')

    // Check for OAuth errors
    if (oauthError) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?slack_error=${encodeURIComponent(oauthError)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=missing_code_or_state', request.url)
      )
    }

    // Verify CSRF state from cookie
    const cookieStore = await cookies()
    const cookieState = cookieStore.get('slack_oauth_state')?.value
    if (!cookieState || cookieState !== state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=state_mismatch', request.url)
      )
    }

    // Verify user authentication
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/signin?redirect=/dashboard/settings', request.url)
      )
    }

    // Verify user is premium before completing Slack OAuth
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (!profile || profile.subscription_tier !== 'premium') {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=premium_required', request.url)
      )
    }

    // Exchange code for access token
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/oauth/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=not_configured', request.url)
      )
    }

    // Call Slack's oauth.v2.access endpoint
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?slack_error=${encodeURIComponent(tokenData.error)}`, request.url)
      )
    }

    // Extract webhook URL from incoming_webhook
    const webhookUrl = tokenData.incoming_webhook?.url
    const teamName = tokenData.team?.name
    const channelName = tokenData.incoming_webhook?.channel

    if (!webhookUrl) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=no_webhook', request.url)
      )
    }

    const supabase = await createClient()

    // Save Slack integration details to user preferences
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({
        slack_webhook_url: webhookUrl,
        delivery_method: 'both', // Enable both email and Slack
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=save_failed', request.url)
      )
    }
    // Clear state cookie
    const res = NextResponse.redirect(
      new URL(
        `/dashboard/settings?slack_success=true&channel=${encodeURIComponent(channelName || 'unknown')}`,
        request.url
      )
    )
    res.cookies.set('slack_oauth_state', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 0,
    })
    return res

  } catch (error) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?slack_error=internal_error', request.url)
    )
  }
}
