import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendDailyPromptEmail } from '@/lib/services/emailService'
import { sendDailyPromptToSlack } from '@/lib/services/slackService'
import { generatePrompt } from '@/lib/services/aiService'
import { selectDailyFocusArea } from '@/lib/services/focusAreaRotationService'
import { sendPushNotifications, isPushConfigured } from '@/lib/services/pushService'
import { GeneratePromptContext, PromptType } from '@/lib/types/reflection'
import crypto from 'crypto'

/**
 * Cron Job: Send Daily Prompts
 * 
 * POST /api/cron/send-daily-prompts
 * 
 * This endpoint should be called every hour (or more frequently) by a cron scheduler
 * (e.g., Vercel Cron, GitHub Actions, or external service like Cron-job.org)
 * 
 * It will:
 * 1. Find all users whose prompt_time matches the current hour
 * 2. Check if they have daily_reminders enabled
 * 3. Check if they haven't already completed today's prompt
 * 4. Generate and send them a daily prompt email
 * 5. Respect free vs premium limits
 * 
 * Security: Requires a CRON_SECRET in headers to prevent unauthorized access
 */

export async function POST(request: NextRequest) {
  try {
    // Security: Require Bearer token with CRON_SECRET (no admin fallback for automation)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid Bearer token required' },
        { status: 401 }
      )
    }
    const supabase = createServiceRoleClient()
    const startTime = Date.now()
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    const today = now.toISOString().split('T')[0]

    const FALLBACK_PROMPT_TEXT = 'Name the emotion that feels most present right now?'

    // Default days for free users (Mon, Wed, Fri = 3x per week)
    const FREE_TIER_DEFAULT_DAYS = ['monday', 'wednesday', 'friday']

    /**
     * Check if today is a valid notification day for the user
     * Free users: Limited to 3x per week (Mon, Wed, Fri or custom_days if set, max 3)
     * Premium users: Based on their prompt_frequency and custom_days settings
     */
    const shouldSendToday = (
      isFreeUser: boolean,
      promptFrequency: string | null,
      customDays: string[] | null,
      userTimezone: string
    ): { shouldSend: boolean; reason: string } => {
      // Get current day of week in user's timezone
      const nowInUserTZ = new Date().toLocaleDateString('en-US', {
        timeZone: userTimezone,
        weekday: 'long'
      }).toLowerCase()

      // For free users, enforce 3x per week limit
      if (isFreeUser) {
        // If user has custom_days set, use up to 3 of them
        const allowedDays = customDays && customDays.length > 0 
          ? customDays.slice(0, 3).map(d => d.toLowerCase())
          : FREE_TIER_DEFAULT_DAYS

        if (allowedDays.includes(nowInUserTZ)) {
          return { shouldSend: true, reason: `free_tier_allowed_day:${nowInUserTZ}` }
        }
        return { shouldSend: false, reason: `free_tier_not_allowed_day:${nowInUserTZ}` }
      }

      // Premium users: check their frequency setting
      const frequency = promptFrequency || 'daily'

      switch (frequency) {
        case 'daily':
          return { shouldSend: true, reason: 'premium_daily' }

        case 'weekdays':
          const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          if (weekdays.includes(nowInUserTZ)) {
            return { shouldSend: true, reason: 'premium_weekday' }
          }
          return { shouldSend: false, reason: `premium_weekend_skip:${nowInUserTZ}` }

        case 'every-other-day':
          // Use day of year to determine odd/even days
          const startOfYear = new Date(new Date().getFullYear(), 0, 0)
          const diff = new Date().getTime() - startOfYear.getTime()
          const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
          if (dayOfYear % 2 === 0) {
            return { shouldSend: true, reason: 'premium_every_other_day' }
          }
          return { shouldSend: false, reason: 'premium_every_other_day_skip' }

        case 'twice-weekly':
          // Default to Tuesday and Friday
          const twiceWeeklyDays = customDays && customDays.length >= 2 
            ? customDays.slice(0, 2).map(d => d.toLowerCase())
            : ['tuesday', 'friday']
          if (twiceWeeklyDays.includes(nowInUserTZ)) {
            return { shouldSend: true, reason: 'premium_twice_weekly' }
          }
          return { shouldSend: false, reason: `premium_twice_weekly_skip:${nowInUserTZ}` }

        case 'weekly':
          // Default to Monday, or first custom day
          const weeklyDay = customDays && customDays.length > 0 
            ? customDays[0].toLowerCase()
            : 'monday'
          if (nowInUserTZ === weeklyDay) {
            return { shouldSend: true, reason: 'premium_weekly' }
          }
          return { shouldSend: false, reason: `premium_weekly_skip:${nowInUserTZ}` }

        case 'custom':
          // Use custom_days array
          if (!customDays || customDays.length === 0) {
            // No custom days set, default to daily
            return { shouldSend: true, reason: 'premium_custom_no_days_default_daily' }
          }
          const customDaysLower = customDays.map(d => d.toLowerCase())
          if (customDaysLower.includes(nowInUserTZ)) {
            return { shouldSend: true, reason: `premium_custom_day:${nowInUserTZ}` }
          }
          return { shouldSend: false, reason: `premium_custom_skip:${nowInUserTZ}` }

        default:
          // Unknown frequency, default to sending
          return { shouldSend: true, reason: 'unknown_frequency_default' }
      }
    }

    const validPromptTypes = new Set<PromptType>([
      'noticing',
      'naming',
      'contrast',
      'perspective',
      'closure',
      'grounding',
    ])
    const isPromptType = (value: any): value is PromptType => validPromptTypes.has(value)

    const calculateStreakFromDates = (dates: string[]): number => {
      if (!dates || dates.length === 0) return 0
      const dateSet = new Set(dates)

      const todayDate = new Date()
      let streak = 0

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(todayDate)
        checkDate.setDate(todayDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]

        const hasReflection = dateSet.has(dateStr)
        if (hasReflection) {
          streak++
        } else if (i > 0) {
          break
        }
      }

      return streak
    }

    // Create initial cron job log entry
    const { data: cronLog, error: cronLogError } = await supabase
      .from('cron_job_runs')
      .insert({
        job_name: 'send_daily_prompts',
        started_at: now.toISOString(),
        status: 'running',
        total_users: 0,
        successful_sends: 0,
        failed_sends: 0,
      })
      .select()
      .single()

    const cronLogId = cronLog?.id

    // Get all users who should receive prompts this hour
    // We'll match users whose prompt_time is within the current hour window
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        subscription_status,
        billing_cycle,
        timezone_iana,
        timezone
      `)
      // Get all users - we'll filter by preferences later
      .not('email', 'is', null)

    if (profilesError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active users to send prompts to',
        sent: 0,
      })
    }
    // Get user preferences for all users
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .in('user_id', profiles.map(p => p.id))

    if (prefsError) {
    }

    const prefsMap = new Map(
      (preferences || []).map(p => [p.user_id, p])
    )

    let sentCount = 0
    let skippedCount = 0
    const results = []

    // Process each user
    for (const profile of profiles) {
      try {
        const userPrefs = prefsMap.get(profile.id)

        // Skip if no preferences or daily reminders disabled
        if (!userPrefs) {
          skippedCount++
          continue
        }

        if (!userPrefs.daily_reminders) {
          skippedCount++
          continue
        }

        // Get user's reminder time and timezone (with DST support)
        const reminderTime = userPrefs.reminder_time || '09:00'
        const userTimezone = profile.timezone_iana || profile.timezone || 'Europe/London'
        
        // Parse user's reminder hour (this is in their LOCAL time)
        const reminderHourLocal = parseInt(reminderTime.split(':')[0], 10)
        const reminderMinuteLocal = parseInt(reminderTime.split(':')[1] || '0', 10)
        
        try {
          // Use JavaScript's Intl API to get current time in user's timezone
          // This automatically handles DST transitions!
          const nowInUserTZ = new Date().toLocaleString('en-US', {
            timeZone: userTimezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          })
          
          const [hourStr, minuteStr] = nowInUserTZ.split(':')
          const currentHourInUserTimezone = parseInt(hourStr, 10)
          const currentMinuteInUserTimezone = parseInt(minuteStr, 10)
          // Check if current hour in user's timezone matches their reminder hour
          if (currentHourInUserTimezone !== reminderHourLocal) {
            continue
          }
        } catch (tzError) {
          // Fall back to skipping this user
          continue
        }

        // Determine if user is free tier
        const isFreeUser = profile.subscription_status !== 'premium' && profile.billing_cycle !== 'gift_trial'
        
        // Check if today is a valid notification day based on frequency settings
        const { shouldSend, reason: frequencyReason } = shouldSendToday(
          isFreeUser,
          userPrefs.prompt_frequency,
          userPrefs.custom_days,
          userTimezone
        )
        
        if (!shouldSend) {
          skippedCount++
          results.push({
            user_id: profile.id,
            status: 'skipped',
            reason: frequencyReason,
          })
          continue
        }

        // Check if user already has a prompt for today
        const { data: existingPrompt } = await supabase
          .from('prompts_history')
          .select('id, used')
          .eq('user_id', profile.id)
          .eq('date_generated', today)
          .single()

        if (existingPrompt) {
          // Check if they've used (completed) the prompt
          if (existingPrompt.used) {
            skippedCount++
            continue
          } else {
            // They have a prompt but haven't completed it - still send reminder
          }
        }

        // Check free tier limits (7 prompts per month for free users)
        if (isFreeUser) {
          // Count prompts used this month
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          const { data: monthPrompts, error: countError } = await supabase
            .from('prompts_history')
            .select('id')
            .eq('user_id', profile.id)
            .gte('date_generated', monthStart)

          if (countError) {
            continue
          }

          const promptsThisMonth = monthPrompts?.length || 0
          
          if (promptsThisMonth >= 7) {
            skippedCount++
            continue
          }
        }

        // Generate a new prompt if one doesn't exist
        let promptText = ''
        
        if (existingPrompt) {
          // Fetch the existing prompt text
          const { data: existingPromptData } = await supabase
            .from('prompts_history')
            .select('prompt_text')
            .eq('id', existingPrompt.id)
            .single()
          
          promptText = existingPromptData?.prompt_text || FALLBACK_PROMPT_TEXT
        } else {
          // Generate new prompt
          // Fetch recent reflections for context
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          const { data: recentReflections } = await supabase
            .from('reflections')
            .select('date, mood, tags')
            .eq('user_id', profile.id)
            .gte('date', thirtyDaysAgo)
            .order('date', { ascending: false })
            .limit(30)

          const reflectionDates: string[] = (recentReflections || [])
            .map((r: any) => r?.date)
            .filter((d: any) => typeof d === 'string' && d.length > 0)
          const currentStreak = calculateStreakFromDates(reflectionDates)

          const { data: recentPrompts } = await supabase
            .from('prompts_history')
            .select('personalization_context')
            .eq('user_id', profile.id)
            .order('date_generated', { ascending: false })
            .limit(12)

          const recentPromptTypes: PromptType[] = (recentPrompts || [])
            .map((p: any) => p?.personalization_context?.prompt_type)
            .filter(isPromptType)

          // Select focus area using deterministic rotation
          const userFocusAreas = userPrefs.focus_areas || []
          let selectedFocusArea: string | null = null
          let rotationReason = ''
          
          if (userFocusAreas.length > 0) {
            const rotationResult = await selectDailyFocusArea(profile.id, userFocusAreas)
            selectedFocusArea = rotationResult.selectedFocus
            rotationReason = rotationResult.reason
          }

          const context: GeneratePromptContext = {
            focus_areas: userFocusAreas,
            focus_area_name: selectedFocusArea || undefined,
            recent_moods: recentReflections?.slice(0, 7).map(r => r.mood) || [],
            recent_topics: recentReflections
              ?.flatMap(r => r.tags)
              .filter((tag, index, self) => self.indexOf(tag) === index)
              .slice(0, 5) || [],
            user_reason: userPrefs.reason || undefined,
            current_streak: currentStreak,
            recent_prompt_types: recentPromptTypes,
          }

          try {
            const { prompt, provider, model, prompt_type } = await generatePrompt(context)
            promptText = prompt

            // Save the generated prompt with focus area tracking
            await supabase
              .from('prompts_history')
              .insert({
                user_id: profile.id,
                prompt_text: promptText,
                ai_provider: provider,
                ai_model: model,
                focus_area_used: selectedFocusArea,
                personalization_context: { ...context, prompt_type, rotation_reason: rotationReason },
                date_generated: today,
                used: false,
              })
          } catch (genError) {
            // Use fallback prompt
            promptText = FALLBACK_PROMPT_TEXT
          }
        }

        // Send via email and/or Slack based on delivery_method preference
        const deliveryMethod = userPrefs.delivery_method || 'email'
        let emailSent = false
        let slackSent = false
        const errors = []

        // Send email if configured
        if (deliveryMethod === 'email' || deliveryMethod === 'both') {
          const emailResult = await sendDailyPromptEmail(
            profile.email,
            promptText,
            profile.id,
            profile.full_name
          )

          if (emailResult.success) {
            emailSent = true
          } else {
            errors.push(`Email: ${emailResult.error}`)
          }
        }

        // Send Slack message if configured
        if ((deliveryMethod === 'slack' || deliveryMethod === 'both') && userPrefs.slack_webhook_url) {
          const slackResult = await sendDailyPromptToSlack(
            userPrefs.slack_webhook_url,
            promptText,
            profile.full_name
          )

          if (slackResult.success) {
            slackSent = true
          } else {
            errors.push(`Slack: ${slackResult.error}`)
          }
        }

        // Send push notification if user has subscriptions
        let pushSent = false
        if (isPushConfigured()) {
          const { data: pushSubs } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', profile.id)

          if (pushSubs && pushSubs.length > 0) {
            const failedEndpoints = await sendPushNotifications(
              pushSubs,
              {
                title: 'Your Daily Prompt is Ready',
                body: promptText.length > 100 ? promptText.substring(0, 97) + '...' : promptText,
                url: '/dashboard',
                tag: `prompt-${today}`,
              }
            )

            // Clean up failed subscriptions
            if (failedEndpoints.length > 0) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', profile.id)
                .in('endpoint', failedEndpoints)
            }

            pushSent = pushSubs.length > failedEndpoints.length
          }
        }

        // Track results
        if (emailSent || slackSent || pushSent) {
          sentCount++
          results.push({
            user_id: profile.id,
            email: profile.email,
            status: 'sent',
            channels: {
              email: emailSent,
              slack: slackSent,
              push: pushSent,
            },
          })
        } else {
          results.push({
            user_id: profile.id,
            email: profile.email,
            status: 'failed',
            error: errors.join(', '),
          })
        }

      } catch (userError) {
        results.push({
          user_id: profile.id,
          status: 'error',
          error: userError instanceof Error ? userError.message : 'Unknown error',
        })
      }
    }
    const executionTime = Date.now() - startTime
    const failedCount = results.filter(r => r.status === 'failed' || r.status === 'error').length

    // Update cron job log with final results
    if (cronLogId) {
      await supabase
        .from('cron_job_runs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'success',
          total_users: profiles.length,
          successful_sends: sentCount,
          failed_sends: failedCount,
          execution_time_ms: executionTime,
          metadata: {
            skipped: skippedCount,
            current_hour: currentHour,
            results_summary: results.slice(0, 10), // Store first 10 results for debugging
          },
        })
        .eq('id', cronLogId)
    }

    return NextResponse.json({
      success: true,
      message: 'Daily prompts sent successfully',
      stats: {
        totalProcessed: profiles.length,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount,
        executionTimeMs: executionTime,
      },
      results,
    })

  } catch (error) {
    // Try to log the failure
    try {
      const supabase = createServiceRoleClient()
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await supabase.from('cron_job_runs').insert({
        job_name: 'send_daily_prompts',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: 'failed',
        total_users: 0,
        successful_sends: 0,
        failed_sends: 0,
        error_message: errorMessage,
        execution_time_ms: 0,
      })
    } catch (logError) {
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/send-daily-prompts
 * Returns endpoint documentation only (no execution)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/cron/send-daily-prompts',
    method: 'POST',
    description: 'Automated cron job that sends daily prompt emails to eligible users',
    requiresAuth: true,
    security: 'Requires Bearer token with CRON_SECRET in Authorization header',
    schedule: 'Should be called every hour',
    example: 'curl -X POST https://yourapp.com/api/cron/send-daily-prompts -H "Authorization: Bearer $CRON_SECRET"'
  })
}
