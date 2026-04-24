import { getAuthUser, createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Onboarding API Route
 * 
 * This endpoint handles saving user onboarding preferences to the database.
 * Called after user completes the onboarding flow.
 * 
 * POST /api/onboarding
 * - Saves user preferences to user_preferences table
 * - Validates user authentication
 * - Prevents duplicate submissions
 */

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.reason || !body.promptTime || !body.delivery || !body.focus) {
      return NextResponse.json(
        { error: 'Missing required fields: reason, promptTime, delivery, focus' },
        { status: 400 }
      )
    }
    
    // Convert time format (e.g., "9am" -> "09:00:00")
    const timeMap: Record<string, string> = {
      "7am": "07:00:00",
      "9am": "09:00:00",
      "12pm": "12:00:00",
      "6pm": "18:00:00",
      "9pm": "21:00:00"
    }
    
    // Normalise delivery method — Slack is premium-only, so new users
    // are forced to email even if they somehow selected Slack.
    const requestedDelivery = typeof body.delivery === 'string' ? body.delivery.toLowerCase() : 'email'
    const deliveryMethod: 'email' | 'slack' = requestedDelivery === 'slack' ? 'email' : 'email'

    // Check if preferences already exist (so we know whether this is first-time onboarding)
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id, created_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const hadExistingPreferences = !!existing

    // Set timezone in profile if provided (auto-detected from browser)
    const userTimezone = body.timezone // Should be IANA timezone like 'America/New_York'

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Provision the user's profile (including 7-day premium trial)
    // BEFORE writing user_preferences. If this fails, the user stays gated on
    // /onboarding (because the preferences row is what unlocks the dashboard).
    // ─────────────────────────────────────────────────────────────────────────
    const serviceClient = createServiceRoleClient()

    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('subscription_status, subscription_tier, is_trial, trial_end_date')
      .eq('id', user.id)
      .maybeSingle()

    const existingStatus = existingProfile?.subscription_status || null
    const existingTier = existingProfile?.subscription_tier || null
    const isPaidUser = existingStatus === 'active' || existingStatus === 'trialing'
    const shouldGrantTrial = !isPaidUser && existingStatus !== 'premium' && existingTier !== 'premium'

    if (shouldGrantTrial) {
      const { error: profileError } = await serviceClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          subscription_status: 'premium',
          subscription_tier: 'premium',
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_trial: true,
          timezone_iana: userTimezone || 'Europe/London',
          timezone: userTimezone || 'Europe/London',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileError) {
        // Abort before writing preferences so the user remains gated on
        // /onboarding and can safely retry. No half-finished state.
        return NextResponse.json(
          { error: 'Failed to provision trial: ' + profileError.message },
          { status: 500 }
        )
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Save preferences. This is the record that unlocks the dashboard,
    // so it MUST be written last — only after the trial profile is in place.
    // Using upsert makes this idempotent and race-safe (fixes
    // "duplicate key value violates unique constraint user_preferences_user_id_key"
    // when the client double-submits).
    // ─────────────────────────────────────────────────────────────────────────
    const preferences = {
      user_id: user.id,
      reason: body.reason,
      current_mood: body.mood || 5,
      prompt_time: timeMap[body.promptTime] || "09:00:00",
      prompt_frequency: body.promptFrequency || "daily",
      delivery_method: deliveryMethod,
      focus_areas: Array.isArray(body.focus) ? body.focus : [],
      push_notifications: body.pushNotifications ?? true,
      daily_reminders: body.dailyReminders ?? true,
      weekly_digest: body.weeklyDigest ?? false,
      // Only set created_at on first insert; preserve original otherwise
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: upserted, error: upsertError } = await supabase
      .from('user_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single()

    const result = { data: upserted, error: upsertError }

    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to save preferences: ' + result.error.message },
        { status: 500 }
      )
    }
    
    // Send welcome email after successful onboarding (one-time)
    if (!hadExistingPreferences) {
      try {
        const { data: existingWelcomeEmail } = await serviceClient
          .from('email_logs')
          .select('id')
          .eq('recipient_email', user.email!)
          .eq('template_name', 'welcome')
          .in('status', ['sent', 'delivered', 'opened', 'clicked'])
          .limit(1)
          .maybeSingle()

        if (!existingWelcomeEmail) {
          const { data: existingWelcomeJob } = await serviceClient
            .from('email_queue')
            .select('id')
            .eq('user_id', user.id)
            .eq('email_type', 'welcome')
            .in('status', ['pending', 'sent'])
            .limit(1)
            .maybeSingle()

          if (!existingWelcomeJob) {
            const displayName = user.user_metadata?.full_name ||
                               user.user_metadata?.name ||
                               user.email?.split('@')[0] ||
                               'there'

            await serviceClient
              .from('email_queue')
              .insert({
                user_id: user.id,
                email_type: 'welcome',
                recipient_email: user.email ?? '',
                recipient_name: displayName,
                scheduled_for: new Date().toISOString(),
                status: 'pending',
                retry_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
          }
        }
      } catch (emailError) {
        // Don't fail the onboarding if email fails
      }
    }
    
    // Success response
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: result.data
    }, { status: 200 })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if user has completed onboarding
 * Returns boolean indicating onboarding status
 */
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    // Check if user has preferences (completed onboarding)
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('id, created_at')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user hasn't completed onboarding)
      return NextResponse.json(
        { error: 'Failed to check onboarding status' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      completed: !!preferences,
      completedAt: preferences?.created_at || null
    }, { status: 200 })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
