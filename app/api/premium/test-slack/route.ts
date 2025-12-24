import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testSlackWebhook, isValidSlackWebhookUrl } from '@/lib/services/slackService'
import { getUserTier } from '@/lib/utils/tierManagement'

/**
 * POST /api/premium/test-slack
 * 
 * Test Slack webhook connection
 * Premium feature only
 * 
 * Body:
 * - webhookUrl: string - Slack webhook URL to test
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Slack integration is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const webhookUrl = body.webhookUrl

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'Webhook URL is required' },
        { status: 400 }
      )
    }

    // Validate webhook URL format
    if (!isValidSlackWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Slack webhook URL format' },
        { status: 400 }
      )
    }

    // Test the webhook
    const result = await testSlackWebhook(webhookUrl)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Slack connection successful!',
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to connect to Slack' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error testing Slack webhook:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to test Slack connection' 
      },
      { status: 500 }
    )
  }
}
