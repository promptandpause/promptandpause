import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * GET /api/integrations/slack/auth-url
 * 
 * Generates Slack OAuth authorization URL for user to connect their workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Slack OAuth credentials from environment
    const clientId = process.env.SLACK_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/oauth/callback`

    if (!clientId) {
      console.error('SLACK_CLIENT_ID not configured')
      return NextResponse.json(
        { error: 'Slack integration not configured' },
        { status: 500 }
      )
    }

    // Generate CSRF state
    const stateBytes = crypto.randomBytes(16)
    const state = stateBytes.toString('hex')

    // Build Slack OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'incoming-webhook',
      redirect_uri: redirectUri,
      state,
    })

    const authUrl = `https://slack.com/oauth/v2/authorize?${params.toString()}`

    const res = NextResponse.json({ url: authUrl })
    // Store state in a secure cookie for later verification
    res.cookies.set('slack_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 300, // 5 minutes
    })

    return res
  } catch (error) {
    console.error('Error generating Slack auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
