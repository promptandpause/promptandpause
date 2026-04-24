import { getAuthUser, createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Server-side lifecycle event. Fire-and-forget — analytics must never block
 * user flow or leak error surface to the client.
 *
 * Runs through the user-scoped Supabase client so RLS still governs writes:
 * the `user_events` policy (`auth.uid() = user_id`) guarantees an event can
 * only ever be attributed to the authenticated caller, even if another part
 * of the route is holding a service-role client for privileged operations.
 */
async function trackLifecycleEvent(
  userId: string,
  event: string,
  properties: Record<string, unknown> = {},
) {
  try {
    const client = await createClient()
    await client.from('user_events').insert({
      user_id: userId,
      event,
      properties,
    })
  } catch {
    // Non-blocking.
  }
}

/**
 * Map raw Postgres / Supabase errors to a calm, user-safe message.
 * Following Apple HIG + Linear: specific when it helps the user, silent about
 * internals otherwise. Real error stays in server logs.
 */
function friendlyOnboardingError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase()
  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return "Looks like you've already set this up. Refresh and you should land on your dashboard."
  }
  if (lower.includes('permission') || lower.includes('rls')) {
    return "We couldn't save your preferences from this session. Sign in again and try once more."
  }
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch')) {
    return 'Your connection dropped mid-save. Give it another go in a moment.'
  }
  return "Something didn't settle on our end. Try again — your answers are still here."
}

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

    // Capture the computed trial window up-front so downstream code
    // (trial_started email queue, lifecycle events) can reference the same
    // canonical values we just persisted on the profile.
    const trialStartDate = new Date().toISOString()
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    if (shouldGrantTrial) {
      const { error: profileError } = await serviceClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          subscription_status: 'premium',
          subscription_tier: 'premium',
          trial_start_date: trialStartDate,
          trial_end_date: trialEndDate,
          is_trial: true,
          timezone_iana: userTimezone || 'Europe/London',
          timezone: userTimezone || 'Europe/London',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileError) {
        // Abort before writing preferences so the user remains gated on
        // /onboarding and can safely retry. No half-finished state.
        console.error('onboarding_trial_provision_error', {
          userId: user.id,
          message: profileError.message,
        })
        return NextResponse.json(
          { error: "We couldn't activate your trial. Try again in a moment." },
          { status: 500 },
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
      console.error('onboarding_preferences_save_error', {
        userId: user.id,
        message: result.error.message,
      })
      return NextResponse.json(
        { error: friendlyOnboardingError(result.error.message) },
        { status: 500 },
      )
    }

    // Lifecycle event — fires exactly once, tied to the first successful save.
    if (!hadExistingPreferences) {
      await trackLifecycleEvent(user.id, 'onboarding_completed', {
        reason: body.reason,
        delivery: deliveryMethod,
        focus_count: Array.isArray(body.focus) ? body.focus.length : 0,
        trial_granted: shouldGrantTrial,
      })
    }
    
    // Queue a "getting started" email whenever this endpoint completes
    // successfully for a user who has a valid email. No longer gated on
    // `!hadExistingPreferences` — that guard meant any user who onboarded
    // before this code was deployed would never receive the email at all.
    // Idempotency is enforced by the email_queue + email_logs lookups below,
    // so re-posting onboarding can never double-queue a send.
    if (user.email) {
      try {
        const { data: existingGettingStartedLog } = await serviceClient
          .from('email_logs')
          .select('id')
          .eq('recipient_email', user.email)
          .eq('template_name', 'getting_started')
          .in('status', ['sent', 'delivered', 'opened', 'clicked'])
          .limit(1)
          .maybeSingle()

        const { data: existingGettingStarted } = await serviceClient
          .from('email_queue')
          .select('id')
          .eq('user_id', user.id)
          .eq('email_type', 'getting_started')
          .in('status', ['pending', 'sent'])
          .limit(1)
          .maybeSingle()

        if (!existingGettingStartedLog && !existingGettingStarted) {
          const displayName = user.user_metadata?.full_name ||
                             user.user_metadata?.name ||
                             user.email.split('@')[0] ||
                             'there'

          await serviceClient
            .from('email_queue')
            .insert({
              user_id: user.id,
              email_type: 'getting_started',
              recipient_email: user.email,
              recipient_name: displayName,
              scheduled_for: new Date().toISOString(),
              status: 'pending',
              retry_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          await trackLifecycleEvent(user.id, 'getting_started_email_queued', {
            trigger: hadExistingPreferences
              ? 'onboarding_replay_backfill'
              : 'onboarding_completed',
          })
        }
      } catch (emailError) {
        // Don't fail the onboarding if email queueing fails.
      }
    }

    // Queue a "trial started" email when (and only when) we actually just
    // granted a new trial on this request. The T-48h reminder is handled by
    // /api/cron/send-trial-reminders, so this email only needs to fire once
    // at grant-time. Idempotent via the same dual-lookup pattern.
    if (user.email && shouldGrantTrial) {
      try {
        const { data: existingTrialStartedLog } = await serviceClient
          .from('email_logs')
          .select('id')
          .eq('recipient_email', user.email)
          .eq('template_name', 'trial_started')
          .in('status', ['sent', 'delivered', 'opened', 'clicked'])
          .limit(1)
          .maybeSingle()

        const { data: existingTrialStartedQueued } = await serviceClient
          .from('email_queue')
          .select('id')
          .eq('user_id', user.id)
          .eq('email_type', 'trial_started')
          .in('status', ['pending', 'sent'])
          .limit(1)
          .maybeSingle()

        if (!existingTrialStartedLog && !existingTrialStartedQueued) {
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email.split('@')[0] ||
            'there'

          await serviceClient.from('email_queue').insert({
            user_id: user.id,
            email_type: 'trial_started',
            recipient_email: user.email,
            recipient_name: displayName,
            scheduled_for: new Date().toISOString(),
            status: 'pending',
            retry_count: 0,
            metadata: { trial_end_date: trialEndDate },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          await trackLifecycleEvent(user.id, 'trial_started_email_queued', {
            trial_end_date: trialEndDate,
          })
        }
      } catch (emailError) {
        // Don't fail the onboarding if email queueing fails.
      }
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: result.data
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('onboarding_unexpected_error', {
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: "Something didn't settle on our end. Try again — your answers are still here." },
      { status: 500 },
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
