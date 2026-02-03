import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { sendDailyPromptEmail } from '@/lib/services/emailService'
import { generatePrompt } from '@/lib/services/aiService'
import { GeneratePromptContext, PromptType } from '@/lib/types/reflection'

/**
 * POST /api/admin/sync-notifications
 * 
 * Admin endpoint to manually trigger daily prompts for users who should have
 * received them today but didn't (due to cron job issues, timing, etc.)
 * 
 * This will:
 * 1. Find all users with daily_reminders enabled
 * 2. Check if today is a valid notification day for them
 * 3. Check if they already received a prompt today
 * 4. Generate and send prompts to those who haven't
 * 
 * Body:
 * - dryRun?: boolean - If true, just report what would be sent without sending
 * - userIds?: string[] - Optional list of specific user IDs to process
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
    const { dryRun = false, userIds } = body

    const serviceSupabase = createServiceRoleClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Default days for free users (Mon, Wed, Fri = 3x per week)
    const FREE_TIER_DEFAULT_DAYS = ['monday', 'wednesday', 'friday']

    // Get current day of week
    const todayDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // Fetch all users with daily_reminders enabled
    let query = serviceSupabase
      .from('user_preferences')
      .select('user_id, daily_reminders, prompt_time, reminder_time, prompt_frequency, custom_days, focus_areas, reason, delivery_method')
      .eq('daily_reminders', true)

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    const { data: userPrefs, error: prefsError } = await query

    if (prefsError) {
      return NextResponse.json({ error: 'Failed to fetch preferences', details: prefsError.message }, { status: 500 })
    }

    if (!userPrefs || userPrefs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with daily_reminders enabled',
        processed: 0,
      })
    }

    // Fetch profiles for all users
    const allUserIds = userPrefs.map(p => p.user_id)
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, email, full_name, subscription_status, billing_cycle, timezone_iana, timezone')
      .in('id', allUserIds)

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles', details: profilesError.message }, { status: 500 })
    }

    // Check which users already have prompts for today
    const { data: existingPrompts } = await serviceSupabase
      .from('prompts_history')
      .select('user_id, used')
      .in('user_id', allUserIds)
      .eq('date_generated', today)

    const existingPromptsMap = new Map(
      (existingPrompts || []).map(p => [p.user_id, p])
    )

    // Helper to check if today is a valid notification day
    const shouldSendToday = (
      isFreeUser: boolean,
      promptFrequency: string | null,
      customDays: string[] | null
    ): { shouldSend: boolean; reason: string } => {
      // For free users, use custom_days or default
      if (isFreeUser) {
        const allowedDays = customDays && customDays.length > 0 
          ? customDays.slice(0, 3).map(d => d.toLowerCase())
          : FREE_TIER_DEFAULT_DAYS

        if (allowedDays.includes(todayDayOfWeek)) {
          return { shouldSend: true, reason: `free_tier_allowed_day:${todayDayOfWeek}` }
        }
        return { shouldSend: false, reason: `free_tier_not_allowed_day:${todayDayOfWeek}_allowed:${allowedDays.join(',')}` }
      }

      // Premium users: check their frequency setting
      const frequency = promptFrequency || 'daily'

      switch (frequency) {
        case 'daily':
          return { shouldSend: true, reason: 'premium_daily' }

        case 'weekdays':
          const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          if (weekdays.includes(todayDayOfWeek)) {
            return { shouldSend: true, reason: 'premium_weekday' }
          }
          return { shouldSend: false, reason: `premium_weekend_skip:${todayDayOfWeek}` }

        case 'custom':
          if (!customDays || customDays.length === 0) {
            return { shouldSend: true, reason: 'premium_custom_no_days_default_daily' }
          }
          const customDaysLower = customDays.map(d => d.toLowerCase())
          if (customDaysLower.includes(todayDayOfWeek)) {
            return { shouldSend: true, reason: `premium_custom_day:${todayDayOfWeek}` }
          }
          return { shouldSend: false, reason: `premium_custom_skip:${todayDayOfWeek}` }

        default:
          return { shouldSend: true, reason: 'unknown_frequency_default' }
      }
    }

    const results: any[] = []
    let sentCount = 0
    let skippedCount = 0
    let errorCount = 0

    const FALLBACK_PROMPT = 'What is one thing you are grateful for today?'

    for (const pref of userPrefs) {
      const profile = profiles?.find(p => p.id === pref.user_id)
      if (!profile?.email) {
        results.push({ user_id: pref.user_id, status: 'skipped', reason: 'no_email' })
        skippedCount++
        continue
      }

      const isFreeUser = profile.subscription_status !== 'premium' && profile.billing_cycle !== 'gift_trial'
      const { shouldSend, reason } = shouldSendToday(isFreeUser, pref.prompt_frequency, pref.custom_days)

      if (!shouldSend) {
        results.push({ 
          user_id: pref.user_id, 
          email: profile.email,
          status: 'skipped', 
          reason,
          custom_days: pref.custom_days,
          prompt_frequency: pref.prompt_frequency,
          is_free: isFreeUser,
        })
        skippedCount++
        continue
      }

      // Check if already has prompt for today
      const existingPrompt = existingPromptsMap.get(pref.user_id)
      if (existingPrompt) {
        results.push({ 
          user_id: pref.user_id, 
          email: profile.email,
          status: 'skipped', 
          reason: existingPrompt.used ? 'already_completed' : 'already_has_prompt',
        })
        skippedCount++
        continue
      }

      if (dryRun) {
        results.push({ 
          user_id: pref.user_id, 
          email: profile.email,
          status: 'would_send', 
          reason: 'dry_run',
          custom_days: pref.custom_days,
          prompt_frequency: pref.prompt_frequency,
          is_free: isFreeUser,
        })
        sentCount++
        continue
      }

      // Generate and send prompt
      try {
        let promptText = FALLBACK_PROMPT
        let aiProvider = 'fallback'
        let aiModel = 'none'

        try {
          const context: GeneratePromptContext = {
            focus_areas: pref.focus_areas || ['Clarity'],
            recent_moods: [],
            recent_topics: [],
            user_reason: pref.reason || undefined,
            current_streak: 0,
            recent_prompt_types: [],
          }
          const result = await generatePrompt(context)
          promptText = result.prompt
          aiProvider = result.provider
          aiModel = result.model
        } catch (genError) {
          // Use fallback prompt
        }

        // Save prompt to history
        await serviceSupabase
          .from('prompts_history')
          .insert({
            user_id: pref.user_id,
            prompt_text: promptText,
            ai_provider: aiProvider,
            ai_model: aiModel,
            date_generated: today,
            used: false,
          })

        // Send email
        const emailResult = await sendDailyPromptEmail(
          profile.email,
          promptText,
          profile.id,
          profile.full_name
        )

        if (emailResult.success) {
          results.push({ 
            user_id: pref.user_id, 
            email: profile.email,
            status: 'sent', 
            prompt: promptText.substring(0, 50) + '...',
          })
          sentCount++
        } else {
          results.push({ 
            user_id: pref.user_id, 
            email: profile.email,
            status: 'failed', 
            error: emailResult.error,
          })
          errorCount++
        }
      } catch (err) {
        results.push({ 
          user_id: pref.user_id, 
          email: profile.email,
          status: 'error', 
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Sync completed',
      todayDayOfWeek,
      stats: {
        totalUsers: userPrefs.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      results,
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/sync-notifications
 * 
 * Get a report of notification status for all users
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
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const todayDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // Get all user preferences with profiles
    const { data: userPrefs } = await serviceSupabase
      .from('user_preferences')
      .select('user_id, daily_reminders, prompt_time, reminder_time, prompt_frequency, custom_days')

    const userIds = userPrefs?.map(p => p.user_id) || []
    
    const { data: profiles } = await serviceSupabase
      .from('profiles')
      .select('id, email, subscription_status, billing_cycle')
      .in('id', userIds)

    // Get today's prompts
    const { data: todaysPrompts } = await serviceSupabase
      .from('prompts_history')
      .select('user_id')
      .eq('date_generated', today)

    const todaysPromptUserIds = new Set((todaysPrompts || []).map(p => p.user_id))

    // Analyze each user
    const FREE_TIER_DEFAULT_DAYS = ['monday', 'wednesday', 'friday']
    const analysis: any[] = []

    for (const pref of userPrefs || []) {
      const profile = profiles?.find(p => p.id === pref.user_id)
      const isFreeUser = profile?.subscription_status !== 'premium' && profile?.billing_cycle !== 'gift_trial'
      
      const allowedDays = isFreeUser
        ? (pref.custom_days && pref.custom_days.length > 0 ? pref.custom_days.slice(0, 3) : FREE_TIER_DEFAULT_DAYS)
        : (pref.prompt_frequency === 'custom' && pref.custom_days ? pref.custom_days : null)

      const shouldReceiveToday = isFreeUser
        ? allowedDays?.map((d: string) => d.toLowerCase()).includes(todayDayOfWeek)
        : (pref.prompt_frequency === 'daily' || 
           (pref.prompt_frequency === 'weekdays' && ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(todayDayOfWeek)) ||
           (pref.prompt_frequency === 'custom' && allowedDays?.map((d: string) => d.toLowerCase()).includes(todayDayOfWeek)))

      analysis.push({
        user_id: pref.user_id,
        email: profile?.email,
        daily_reminders: pref.daily_reminders,
        is_free: isFreeUser,
        prompt_frequency: pref.prompt_frequency,
        custom_days: pref.custom_days,
        allowed_days: allowedDays,
        should_receive_today: shouldReceiveToday,
        has_prompt_today: todaysPromptUserIds.has(pref.user_id),
        needs_prompt: pref.daily_reminders && shouldReceiveToday && !todaysPromptUserIds.has(pref.user_id),
      })
    }

    const needsPrompt = analysis.filter(a => a.needs_prompt)

    return NextResponse.json({
      success: true,
      todayDayOfWeek,
      today,
      summary: {
        totalUsers: analysis.length,
        withDailyReminders: analysis.filter(a => a.daily_reminders).length,
        shouldReceiveToday: analysis.filter(a => a.should_receive_today).length,
        hasPromptToday: analysis.filter(a => a.has_prompt_today).length,
        needsPrompt: needsPrompt.length,
      },
      usersNeedingPrompt: needsPrompt,
      allUsers: analysis,
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
