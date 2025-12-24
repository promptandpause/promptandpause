import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/services/emailService'

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
      .single()
    
    let result
    
    if (existing) {
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
      console.error('Database error:', result.error)
      return NextResponse.json(
        { error: 'Failed to save preferences: ' + result.error.message },
        { status: 500 }
      )
    }
    
    // Create or update user profile record with 7-day premium trial
    // This is essential for useTier hook and other features
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        subscription_status: 'premium',  // Start with premium trial
        subscription_tier: 'premium',
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        is_trial: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
    
    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the request, but log the error
      // User preferences are saved, profile can be created later
    } else {
      console.log('✅ Profile created with 7-day premium trial')
    }
    
    // Send welcome email after successful onboarding
    try {
      const displayName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         'there'
      
      console.log('📧 Sending welcome email to:', user.email, 'Display name:', displayName)
      await sendWelcomeEmail(user.email!, displayName)
      console.log('✅ Welcome email sent successfully')
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError)
      // Don't fail the onboarding if email fails
    }
    
    // Success response
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: result.data
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('Onboarding API error:', error)
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
      console.error('Database error:', error)
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
    console.error('Onboarding check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
