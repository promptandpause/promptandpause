import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendDailyPromptEmail } from '@/lib/services/emailService'
import { sendDailyPromptToSlack } from '@/lib/services/slackService'
import { generatePrompt } from '@/lib/services/aiService'
import { GeneratePromptContext } from '@/lib/types/reflection'
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
    // Security: Verify cron secret OR admin authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    let isAuthorized = false

    // Check if request is from Vercel Cron (with secret)
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
    } else {
      // Check if request is from authenticated admin user
      const { createClient } = require('@/lib/supabase/server')
      const supabaseAuth = await createClient()
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
      
      if (user && !authError) {
        // Check if user is admin
        const { checkAdminAuth } = require('@/lib/services/adminService')
        const adminAuth = await checkAdminAuth(user.email || '')
        if (adminAuth.isAdmin) {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access or cron secret required' },
        { status: 401 }
      )
    }
    const supabase = createServiceRoleClient()
    const startTime = Date.now()
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    const today = now.toISOString().split('T')[0]

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

        // Check free tier limits (assume 7 prompts per month for free users)
        const isFreeUser = profile.subscription_status !== 'premium' && profile.billing_cycle !== 'gift_trial'
        
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
          
          promptText = existingPromptData?.prompt_text || 'What emotion am I feeling right now, and what might be causing it?'
        } else {
          // Generate new prompt
          // Fetch recent reflections for context
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          const { data: recentReflections } = await supabase
            .from('reflections')
            .select('mood, tags')
            .eq('user_id', profile.id)
            .gte('date', thirtyDaysAgo)
            .order('date', { ascending: false })
            .limit(10)

          const context: GeneratePromptContext = {
            focus_areas: userPrefs.focus_areas || [],
            recent_moods: recentReflections?.slice(0, 7).map(r => r.mood) || [],
            recent_topics: recentReflections
              ?.flatMap(r => r.tags)
              .filter((tag, index, self) => self.indexOf(tag) === index)
              .slice(0, 5) || [],
            user_reason: userPrefs.reason || undefined,
          }

          try {
            const { prompt, provider, model } = await generatePrompt(context)
            promptText = prompt

            // Save the generated prompt
            await supabase
              .from('prompts_history')
              .insert({
                user_id: profile.id,
                prompt_text: promptText,
                ai_provider: provider,
                ai_model: model,
                personalization_context: context,
                date_generated: today,
                used: false,
              })
          } catch (genError) {
            // Use fallback prompt
            promptText = 'What emotion am I feeling right now, and what might be causing it?'
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

        // Track results
        if (emailSent || slackSent) {
          sentCount++
          results.push({
            user_id: profile.id,
            email: profile.email,
            status: 'sent',
            channels: {
              email: emailSent,
              slack: slackSent,
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
 * Returns information about the cron endpoint
 */
export async function GET(request: NextRequest) {
  // Vercel Cron sends GET requests with Authorization: Bearer <CRON_SECRET> header
  // Also supports signed GET with ts & sig query params as fallback
  try {
    const { searchParams, origin } = new URL(request.url)
    const ts = searchParams.get('ts')
    const sig = searchParams.get('sig')
    const secret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')

    // Check if request has valid Bearer token (Vercel Cron standard)
    const hasValidBearerToken = secret && authHeader === `Bearer ${secret}`

    const withinWindow = (t: string | null) => {
      if (!t) return false
      const now = Math.floor(Date.now() / 1000)
      const n = Number(t)
      return Number.isFinite(n) && Math.abs(now - n) <= 300 // 5 min window
    }

    const validSig = (t: string | null) => {
      if (!secret || !t || !sig) return false
      const h = crypto.createHmac('sha256', secret).update(String(t)).digest('hex')
      try {
        return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig))
      } catch {
        return false
      }
    }

    // Accept either: Bearer token auth OR signed GET params
    if (hasValidBearerToken || (ts && sig && withinWindow(ts) && validSig(ts))) {
      // Forward to POST handler internally with Authorization header
      const resp = await fetch(`${origin}/api/cron/send-daily-prompts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      })
      const json = await resp.json().catch(() => ({ forwarded: true }))
      return NextResponse.json(json, { status: resp.status })
    }

    // Otherwise return informational payload (unchanged behavior)
    return NextResponse.json({
      endpoint: '/api/cron/send-daily-prompts',
      method: 'POST',
      description: 'Automated cron job that sends daily prompt emails to eligible users',
      requiresAuth: true,
      security: 'Requires Bearer token with CRON_SECRET in Authorization header or signed GET with ts & sig',
      schedule: 'Should be called every hour',
      signedGet: {
        url: '/api/cron/send-daily-prompts?ts={unix_seconds}&sig=HMAC_SHA256(ts, CRON_SECRET)'
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
