import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/integrations/slack/disconnect
 * 
 * Disconnects Slack integration for the authenticated user
 */
export async function POST(request: NextRequest) {
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

    // Remove Slack webhook URL from user preferences
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({
        slack_webhook_url: null,
        slack_channel_name: null,
        slack_channel_id: null,
        delivery_method: 'email', // Fallback to email only
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error disconnecting Slack:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect Slack' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Slack disconnected successfully' 
    })
  } catch (error) {
    console.error('Error disconnecting Slack:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Slack' },
      { status: 500 }
    )
  }
}
