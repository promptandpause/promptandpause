import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendDailyPromptEmail, sendBatchDailyPromptEmails } from '@/lib/services/emailService'
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
    console.log('[CRON] POST handler started')
    
    // Security: Require Bearer token with CRON_SECRET (no admin fallback for automation)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    console.log('[CRON] Auth check', { hasAuth: !!authHeader, hasSecret: !!cronSecret })

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log('[CRON] Auth failed')
      return NextResponse.json(
        { error: 'Unauthorized - Valid Bearer token required' },
        { status: 401 }
      )
    }
    
    console.log('[CRON] Auth passed')
    const supabase = createServiceRoleClient()
    console.log('[CRON] Supabase client created')
    
    const startTime = Date.now()
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    const today = now.toISOString().split('T')[0]
    
    console.log('[CRON] Time vars set', { currentHour, today })

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
      let nowInUserTZ: string
      
      try {
        // Check if timezone is a UTC offset format (e.g., "UTC-05:00")
        const utcOffsetMatch = userTimezone.match(/^UTC([+-])(\d{1,2}):(\d{2})$/)
        
        if (utcOffsetMatch) {
          // For UTC offsets, manually calculate the local date
          const sign = utcOffsetMatch[1] === '+' ? 1 : -1
          const offsetHours = parseInt(utcOffsetMatch[2], 10)
          const offsetMinutes = parseInt(utcOffsetMatch[3], 10)
          const totalOffsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000
          
          const localDate = new Date(now.getTime() + totalOffsetMs)
          nowInUserTZ = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        } else {
          // Use IANA timezone
          nowInUserTZ = new Date().toLocaleDateString('en-US', {
            timeZone: userTimezone,
            weekday: 'long'
          }).toLowerCase()
        }
      } catch (error) {
        // Fallback to UTC if timezone is invalid
        nowInUserTZ = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      }

      // For free users, enforce 3x per week limit
      if (isFreeUser) {
        // If user has custom_days set, use up to 3 of them
        const allowedDays = customDays && customDays.length > 0 
          ? customDays.slice(0, 3).map(d => d.toLowerCase())
          : FREE_TIER_DEFAULT_DAYS

        console.log(`[CRON] Free user check: today=${nowInUserTZ}, allowedDays=${JSON.stringify(allowedDays)}, customDays=${JSON.stringify(customDays)}`)

        if (allowedDays.includes(nowInUserTZ)) {
          return { shouldSend: true, reason: `free_tier_allowed_day:${nowInUserTZ}` }
        }
        return { shouldSend: false, reason: `free_tier_not_allowed_day:${nowInUserTZ}_allowed:${allowedDays.join(',')}` }
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

    console.log('[CRON] About to create cron job log entry')
    
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

    if (cronLogError) {
      console.error('[CRON] Failed to create cron job log:', cronLogError)
      // Continue anyway - logging shouldn't block the cron job
    } else {
      console.log('[CRON] Cron log created:', cronLog?.id)
    }

    const cronLogId = cronLog?.id

    console.log('[CRON] About to fetch users with preferences')
    
    // Fetch user preferences first
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('user_id, daily_reminders, prompt_time, reminder_time, prompt_frequency, custom_days, focus_areas, reason, delivery_method, slack_webhook_url, language')
      .eq('daily_reminders', true)

    if (prefsError) {
      console.error('[CRON] Failed to fetch preferences:', prefsError)
      return NextResponse.json(
        { error: 'Failed to fetch preferences', details: prefsError.message },
        { status: 500 }
      )
    }

    console.log('[CRON] Fetched preferences:', userPrefs?.length || 0)

    if (!userPrefs || userPrefs.length === 0) {
      if (cronLogId) {
        await supabase.from('cron_job_runs').update({
          completed_at: new Date().toISOString(),
          status: 'success',
          total_users: 0,
          successful_sends: 0,
          failed_sends: 0,
          execution_time_ms: Date.now() - startTime,
          metadata: { message: 'No users with daily_reminders enabled' },
        }).eq('id', cronLogId)
      }
      return NextResponse.json({
        success: true,
        message: 'No users with daily reminders enabled',
        sent: 0,
      })
    }

    // Fetch corresponding profiles
    const userIds = userPrefs.map(p => p.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_status, billing_cycle, timezone_iana, timezone')
      .in('id', userIds)

    if (profilesError) {
      console.error('[CRON] Failed to fetch profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      )
    }

    console.log('[CRON] Fetched profiles:', profiles?.length || 0)

    // Join them in code
    const usersWithPrefs = userPrefs.map(pref => {
      const profile = profiles?.find(p => p.id === pref.user_id)
      return {
        ...pref,
        profiles: profile || null
      }
    }).filter(u => u.profiles !== null)
    
    console.log('[CRON] Combined users with profiles:', usersWithPrefs.length)

    if (!usersWithPrefs || usersWithPrefs.length === 0) {
      // Log this for debugging
      if (cronLogId) {
        await supabase
          .from('cron_job_runs')
          .update({
            completed_at: new Date().toISOString(),
            status: 'success',
            total_users: 0,
            successful_sends: 0,
            failed_sends: 0,
            execution_time_ms: Date.now() - startTime,
            metadata: { 
              message: 'No users with daily_reminders enabled found',
              debug: 'Check user_preferences table - daily_reminders column may be NULL or false for all users'
            },
          })
          .eq('id', cronLogId)
      }
      return NextResponse.json({
        success: true,
        message: 'No users with daily reminders enabled',
        sent: 0,
        debug: {
          hint: 'Check if user_preferences.daily_reminders is true for any users',
          query: 'SELECT COUNT(*) FROM user_preferences WHERE daily_reminders = true'
        }
      })
    }

    /**
     * Helper function to get current hour in user's timezone
     * Handles both IANA timezones (e.g., "Europe/London") and UTC offsets (e.g., "UTC-05:00")
     */
    const getCurrentHourInTimezone = (timezone: string): number | null => {
      try {
        // Check if timezone is a UTC offset format (e.g., "UTC-05:00", "UTC+02:00")
        const utcOffsetMatch = timezone.match(/^UTC([+-])(\d{1,2}):(\d{2})$/)
        
        if (utcOffsetMatch) {
          // Handle UTC offset format
          const sign = utcOffsetMatch[1] === '+' ? 1 : -1
          const offsetHours = parseInt(utcOffsetMatch[2], 10)
          const offsetMinutes = parseInt(utcOffsetMatch[3], 10)
          const totalOffsetHours = sign * (offsetHours + offsetMinutes / 60)
          
          // Calculate current hour in that timezone
          const utcHour = now.getUTCHours()
          const utcMinutes = now.getUTCMinutes()
          const localHour = utcHour + totalOffsetHours
          
          // Handle day wraparound
          if (localHour < 0) return Math.floor(localHour + 24)
          if (localHour >= 24) return Math.floor(localHour - 24)
          return Math.floor(localHour)
        }
        
        // Handle IANA timezone format (e.g., "Europe/London", "America/New_York")
        const nowInUserTZ = new Date().toLocaleString('en-US', {
          timeZone: timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
        
        const [hourStr] = nowInUserTZ.split(':')
        return parseInt(hourStr, 10)
      } catch (error) {
        // If timezone is invalid, return null to skip this user
        return null
      }
    }

    // OPTIMIZATION: Pre-filter users by timezone/hour match BEFORE processing
    // This dramatically reduces the number of users we need to process
    const eligibleUsers = usersWithPrefs.filter(user => {
      const profile = user.profiles as any
      if (!profile?.email) return false
      
      // Use prompt_time (from onboarding) or reminder_time (from settings) - handle both "09:00" and "09:00:00" formats
      const reminderTime = user.prompt_time || user.reminder_time || '09:00'
      const userTimezone = profile.timezone_iana || profile.timezone || 'Europe/London'
      const reminderHourLocal = parseInt(reminderTime.split(':')[0], 10)
      
      const currentHourInUserTimezone = getCurrentHourInTimezone(userTimezone)
      
      // If timezone parsing failed, skip this user
      if (currentHourInUserTimezone === null) return false
      
      return currentHourInUserTimezone === reminderHourLocal
    })

    if (eligibleUsers.length === 0) {
      // Collect debug info about why no users matched
      const sampleUsers = usersWithPrefs.slice(0, 5).map(u => {
        const profile = u.profiles as any
        return {
          user_id: u.user_id,
          prompt_time: u.prompt_time,
          reminder_time: u.reminder_time,
          timezone: profile?.timezone_iana || profile?.timezone || 'Europe/London',
          daily_reminders: u.daily_reminders,
        }
      })
      
      // Update cron log and return early
      if (cronLogId) {
        await supabase
          .from('cron_job_runs')
          .update({
            completed_at: new Date().toISOString(),
            status: 'success',
            total_users: 0,
            successful_sends: 0,
            failed_sends: 0,
            execution_time_ms: Date.now() - startTime,
            metadata: { 
              message: 'No users matched current hour',
              total_with_reminders_enabled: usersWithPrefs.length,
              current_hour_utc: currentHour,
              sample_users: sampleUsers,
            },
          })
          .eq('id', cronLogId)
      }
      return NextResponse.json({
        success: true,
        message: 'No users scheduled for this hour',
        sent: 0,
        debug: {
          total_users_with_daily_reminders: usersWithPrefs.length,
          current_hour_utc: currentHour,
          sample_user_times: sampleUsers,
          hint: 'Users have daily_reminders enabled but their prompt_time does not match current hour in their timezone'
        }
      })
    }

    // OPTIMIZATION: Batch fetch existing prompts for all eligible users
    const eligibleUserIds = eligibleUsers.map(u => u.user_id)
    const { data: existingPrompts } = await supabase
      .from('prompts_history')
      .select('id, user_id, used, prompt_text')
      .in('user_id', eligibleUserIds)
      .eq('date_generated', today)
    
    const existingPromptsMap = new Map(
      (existingPrompts || []).map(p => [p.user_id, p])
    )

    // OPTIMIZATION: Batch fetch weekly prompt counts for free users (3 per week limit)
    const freeUserIds = eligibleUsers
      .filter(u => {
        const profile = u.profiles as any
        return profile.subscription_status !== 'premium' && profile.billing_cycle !== 'gift_trial'
      })
      .map(u => u.user_id)
    
    // Calculate start of current week (Monday)
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // If Sunday, go back 6 days
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    
    const { data: weeklyPrompts } = await supabase
      .from('prompts_history')
      .select('user_id')
      .in('user_id', freeUserIds)
      .gte('date_generated', weekStartStr)
    
    const weeklyCountMap = new Map<string, number>()
    for (const p of weeklyPrompts || []) {
      weeklyCountMap.set(p.user_id, (weeklyCountMap.get(p.user_id) || 0) + 1)
    }

    // OPTIMIZATION: Batch fetch push subscriptions
    const { data: allPushSubs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', eligibleUserIds)
    
    const pushSubsMap = new Map<string, any[]>()
    for (const sub of allPushSubs || []) {
      if (!pushSubsMap.has(sub.user_id)) {
        pushSubsMap.set(sub.user_id, [])
      }
      pushSubsMap.get(sub.user_id)!.push(sub)
    }

    let sentCount = 0
    let skippedCount = 0
    const results: any[] = []

    // =========================================================================
    // PHASE 1: Generate prompts and determine delivery for each user
    // This phase handles eligibility checks, AI prompt generation, and
    // collecting payloads for batch sending. Prompt generation is sequential
    // because each user gets a personalized AI-generated prompt.
    // =========================================================================
    
    interface PreparedUser {
      userId: string
      email: string
      fullName: string | null
      promptText: string
      deliveryMethod: string
      slackWebhookUrl: string | null
    }
    
    const preparedUsers: PreparedUser[] = []
    
    for (const user of eligibleUsers) {
      const profile = user.profiles as any
      const userPrefs = user
      
      try {
        const userTimezone = profile.timezone_iana || profile.timezone || 'Europe/London'
        
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
          results.push({ user_id: profile.id, status: 'skipped', reason: frequencyReason })
          skippedCount++
          continue
        }

        // Check if user already has a prompt for today (from pre-fetched data)
        const existingPrompt = existingPromptsMap.get(profile.id)

        if (existingPrompt) {
          results.push({ user_id: profile.id, status: 'skipped', reason: 'prompt_already_generated_today' })
          skippedCount++
          continue
        }

        // Check free tier limits (3 prompts per WEEK for free users) - from pre-fetched data
        if (isFreeUser) {
          const promptsThisWeek = weeklyCountMap.get(profile.id) || 0
          if (promptsThisWeek >= 3) {
            results.push({ user_id: profile.id, status: 'skipped', reason: 'free_tier_weekly_limit_reached' })
            skippedCount++
            continue
          }
        }

        // Generate a new prompt
        let promptText = ''

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
          language: userPrefs.language || 'en',
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

        // Add to prepared users for batch delivery
        preparedUsers.push({
          userId: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          promptText,
          deliveryMethod: userPrefs.delivery_method || 'email',
          slackWebhookUrl: userPrefs.slack_webhook_url || null,
        })

      } catch (userError) {
        results.push({
          user_id: profile.id,
          status: 'error',
          error: userError instanceof Error ? userError.message : 'Unknown error',
        })
      }
    }

    console.log(`[CRON] Phase 1 complete: ${preparedUsers.length} users ready for delivery, ${skippedCount} skipped`)

    // =========================================================================
    // PHASE 2: Batch send emails via Resend batch API (100 per request)
    // This avoids the 2 req/sec rate limit by sending 100 emails per API call.
    // 5000 users = 50 batch calls with 600ms delay = ~30 seconds total.
    // =========================================================================
    
    const emailPayloads = preparedUsers
      .filter(u => u.deliveryMethod === 'email' || u.deliveryMethod === 'both')
      .map(u => ({
        email: u.email,
        prompt: u.promptText,
        userId: u.userId,
        userName: u.fullName,
      }))

    let batchEmailResults: Map<string, { status: 'sent' | 'failed'; emailId?: string; error?: string }> = new Map()

    if (emailPayloads.length > 0) {
      console.log(`[CRON] Phase 2: Batch sending ${emailPayloads.length} emails`)
      const batchResult = await sendBatchDailyPromptEmails(emailPayloads)
      
      for (const r of batchResult.results) {
        batchEmailResults.set(r.userId, r)
      }
      console.log(`[CRON] Phase 2 complete: ${batchResult.sent} sent, ${batchResult.failed} failed`)
    }

    // =========================================================================
    // PHASE 3: Send Slack and push notifications (not rate-limited by Resend)
    // These can be sent in parallel since they use different services.
    // =========================================================================
    
    for (const user of preparedUsers) {
      let emailSent = false
      let slackSent = false
      let pushSent = false
      const errors: string[] = []

      // Check email result from batch send
      if (user.deliveryMethod === 'email' || user.deliveryMethod === 'both') {
        const emailResult = batchEmailResults.get(user.userId)
        if (emailResult?.status === 'sent') {
          emailSent = true
        } else {
          errors.push(`Email: ${emailResult?.error || 'Not sent'}`)
        }
      }

      // Send Slack message if configured
      if ((user.deliveryMethod === 'slack' || user.deliveryMethod === 'both') && user.slackWebhookUrl) {
        const slackResult = await sendDailyPromptToSlack(
          user.slackWebhookUrl,
          user.promptText,
          user.fullName
        )

        if (slackResult.success) {
          slackSent = true
        } else {
          errors.push(`Slack: ${slackResult.error}`)
        }
      }

      // Send push notification if user has subscriptions (from pre-fetched data)
      if (isPushConfigured()) {
        const pushSubs = pushSubsMap.get(user.userId)

        if (pushSubs && pushSubs.length > 0) {
          const failedEndpoints = await sendPushNotifications(
            pushSubs,
            {
              title: 'Your Daily Prompt is Ready',
              body: user.promptText.length > 100 ? user.promptText.substring(0, 97) + '...' : user.promptText,
              url: '/dashboard',
              tag: `prompt-${today}`,
            }
          )

          // Clean up failed subscriptions asynchronously (don't wait)
          if (failedEndpoints.length > 0) {
            supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user.userId)
              .in('endpoint', failedEndpoints)
              .then(() => {})
          }

          pushSent = pushSubs.length > failedEndpoints.length
        }
      }

      // Record result
      if (emailSent || slackSent || pushSent) {
        results.push({
          user_id: user.userId,
          email: user.email,
          status: 'sent',
          channels: { email: emailSent, slack: slackSent, push: pushSent },
        })
        sentCount++
      } else {
        results.push({
          user_id: user.userId,
          email: user.email,
          status: 'failed',
          error: errors.join(', '),
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
          total_users: eligibleUsers.length,
          successful_sends: sentCount,
          failed_sends: failedCount,
          execution_time_ms: executionTime,
          metadata: {
            skipped: skippedCount,
            current_hour: currentHour,
            eligible_users: eligibleUsers.length,
            results_summary: results.slice(0, 10), // Store first 10 results for debugging
          },
        })
        .eq('id', cronLogId)
    }

    return NextResponse.json({
      success: true,
      message: 'Daily prompts sent successfully',
      stats: {
        totalProcessed: eligibleUsers.length,
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
