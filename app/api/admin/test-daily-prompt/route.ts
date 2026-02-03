import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { sendDailyPromptEmail } from '@/lib/services/emailService'
import { sendDailyPromptToSlack } from '@/lib/services/slackService'
import { generatePrompt } from '@/lib/services/aiService'
import { GeneratePromptContext } from '@/lib/types/reflection'

/**
 * POST /api/admin/test-daily-prompt
 * 
 * Test endpoint to verify the daily prompt email flow works.
 * Sends a test prompt to a specific user or the admin themselves.
 * 
 * Body:
 * - userId?: string - User ID to send test to (defaults to admin)
 * - channel?: 'email' | 'slack' | 'both' - Delivery channel (defaults to 'email')
 * - useRealPrompt?: boolean - Generate real AI prompt vs test prompt (defaults to false)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { userId, channel = 'email', useRealPrompt = false } = body

    const serviceSupabase = createServiceRoleClient()

    // Get target user (default to admin)
    const targetUserId = userId || user.id
    const { data: targetProfile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, email, full_name, timezone_iana, timezone')
      .eq('id', targetUserId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ 
        error: 'User not found',
        userId: targetUserId 
      }, { status: 404 })
    }

    // Get user preferences
    const { data: userPrefs } = await serviceSupabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    // Generate or use test prompt
    let promptText = 'This is a test prompt to verify your daily prompt notifications are working correctly. What is one thing you are grateful for today?'
    let aiProvider = 'test'
    let aiModel = 'test'

    if (useRealPrompt) {
      try {
        const context: GeneratePromptContext = {
          focus_areas: userPrefs?.focus_areas || ['Clarity'],
          recent_moods: [],
          recent_topics: [],
          user_reason: userPrefs?.reason || undefined,
          current_streak: 0,
          recent_prompt_types: [],
        }
        const result = await generatePrompt(context)
        promptText = result.prompt
        aiProvider = result.provider
        aiModel = result.model
      } catch (genError) {
        // Keep test prompt on error
      }
    }

    const results: any = {
      targetUser: {
        id: targetProfile.id,
        email: targetProfile.email,
        name: targetProfile.full_name,
      },
      prompt: promptText,
      aiProvider,
      aiModel,
      channels: {},
    }

    // Send via email
    if (channel === 'email' || channel === 'both') {
      const emailResult = await sendDailyPromptEmail(
        targetProfile.email,
        promptText,
        targetProfile.id,
        targetProfile.full_name
      )
      results.channels.email = emailResult
    }

    // Send via Slack
    if ((channel === 'slack' || channel === 'both') && userPrefs?.slack_webhook_url) {
      const slackResult = await sendDailyPromptToSlack(
        userPrefs.slack_webhook_url,
        promptText,
        targetProfile.full_name
      )
      results.channels.slack = slackResult
    } else if (channel === 'slack' || channel === 'both') {
      results.channels.slack = { 
        success: false, 
        error: 'No Slack webhook URL configured for this user' 
      }
    }

    // Check if any channel succeeded
    const anySuccess = Object.values(results.channels).some((r: any) => r.success)

    return NextResponse.json({
      success: anySuccess,
      message: anySuccess 
        ? 'Test prompt sent successfully' 
        : 'Failed to send test prompt - check channel results',
      results,
      userPreferences: userPrefs ? {
        daily_reminders: userPrefs.daily_reminders,
        prompt_time: userPrefs.prompt_time,
        reminder_time: userPrefs.reminder_time,
        delivery_method: userPrefs.delivery_method,
        prompt_frequency: userPrefs.prompt_frequency,
      } : null,
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/test-daily-prompt
 * 
 * Diagnostic endpoint to check the daily prompt system status.
 * Returns stats about users, preferences, and recent cron runs.
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Get user preference stats
    const { data: prefStats } = await serviceSupabase
      .from('user_preferences')
      .select('daily_reminders, prompt_time, delivery_method, prompt_frequency, custom_days')

    const stats = {
      total_users_with_preferences: prefStats?.length || 0,
      daily_reminders_enabled: prefStats?.filter(p => p.daily_reminders === true).length || 0,
      daily_reminders_disabled: prefStats?.filter(p => p.daily_reminders === false).length || 0,
      daily_reminders_null: prefStats?.filter(p => p.daily_reminders === null).length || 0,
      delivery_methods: {
        email: prefStats?.filter(p => p.delivery_method === 'email').length || 0,
        slack: prefStats?.filter(p => p.delivery_method === 'slack').length || 0,
        both: prefStats?.filter(p => p.delivery_method === 'both').length || 0,
        null: prefStats?.filter(p => p.delivery_method === null).length || 0,
      },
      prompt_frequencies: {
        daily: prefStats?.filter(p => p.prompt_frequency === 'daily').length || 0,
        weekdays: prefStats?.filter(p => p.prompt_frequency === 'weekdays').length || 0,
        custom: prefStats?.filter(p => p.prompt_frequency === 'custom').length || 0,
        null: prefStats?.filter(p => p.prompt_frequency === null).length || 0,
        other: prefStats?.filter(p => p.prompt_frequency && !['daily', 'weekdays', 'custom'].includes(p.prompt_frequency)).length || 0,
      },
      custom_days_stats: {
        has_custom_days: prefStats?.filter(p => p.custom_days && p.custom_days.length > 0).length || 0,
        no_custom_days: prefStats?.filter(p => !p.custom_days || p.custom_days.length === 0).length || 0,
      },
      prompt_times: {} as Record<string, number>,
    }

    // Count prompt times
    prefStats?.forEach(p => {
      const time = p.prompt_time || 'null'
      stats.prompt_times[time] = (stats.prompt_times[time] || 0) + 1
    })
    
    // Get users with Tuesday in their custom_days (for debugging today's issue)
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const usersWithTodayInCustomDays = prefStats?.filter(p => 
      p.custom_days && Array.isArray(p.custom_days) && p.custom_days.map((d: string) => d.toLowerCase()).includes(today)
    ).length || 0

    // Get recent cron runs
    const { data: recentRuns } = await serviceSupabase
      .from('cron_job_runs')
      .select('*')
      .eq('job_name', 'send_daily_prompts')
      .order('started_at', { ascending: false })
      .limit(10)

    // Get recent email logs
    const { data: recentEmails } = await serviceSupabase
      .from('email_delivery_log')
      .select('*')
      .eq('email_type', 'daily_prompt')
      .order('sent_at', { ascending: false })
      .limit(10)

    // Check environment
    const envCheck = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'not set',
      CRON_SECRET: !!process.env.CRON_SECRET,
    }

    return NextResponse.json({
      success: true,
      stats,
      todayDebug: {
        today,
        usersWithTodayInCustomDays,
      },
      recentCronRuns: recentRuns,
      recentEmailLogs: recentEmails,
      environment: envCheck,
      currentTime: {
        utc: new Date().toISOString(),
        utcHour: new Date().getUTCHours(),
      },
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
