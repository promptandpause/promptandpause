import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }
    
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
    
    // Prepare preferences data
    const preferences = {
      user_id: user.id,
      reason: body.reason,
      current_mood: body.mood || 5,
      prompt_time: timeMap[body.promptTime] || "09:00:00",
      prompt_frequency: body.promptFrequency || "daily",
      delivery_method: body.delivery.toLowerCase() as "email" | "slack",
      focus_areas: Array.isArray(body.focus) ? body.focus : [],
      push_notifications: body.pushNotifications ?? true,
      daily_reminders: body.dailyReminders ?? true,
      weekly_digest: body.weeklyDigest ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Check if preferences already exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    
    let result
    
    const hadExistingPreferences = !!existing

    if (hadExistingPreferences) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          created_at: undefined, // Don't update created_at
        })
        .eq('user_id', user.id)
        .select()
        .single()
      
      result = { data, error }
    } else {
      // Insert new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(preferences)
        .select()
        .single()
      
      result = { data, error }
    }
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to save preferences: ' + result.error.message },
        { status: 500 }
      )
    }
    
    // Create or update user profile record with 7-day premium trial
    // This is essential for useTier hook and other features
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
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileError) {
        if (!hadExistingPreferences) {
          await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', user.id)
        }

        return NextResponse.json(
          { error: 'Failed to provision trial: ' + profileError.message },
          { status: 500 }
        )
      }
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
                recipient_email: user.email!,
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
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }
    
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
