import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPreferences, upsertUserPreferences } from '@/lib/services/userService'
import { z } from 'zod'

// Zod schema for user preferences - must match all fields sent from settings page
const UserPreferencesSchema = z.object({
  // Profile/locale settings
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  privacy_mode: z.boolean().optional(),
  
  // Notification settings (these are the actual field names used)
  push_notifications: z.boolean().optional(),
  daily_reminders: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
  include_self_journal_in_insights: z.boolean().optional(),
  reminder_time: z.string().optional(),
  
  // Prompt settings
  prompt_frequency: z.enum(['daily', 'weekdays', 'every-other-day', 'twice-weekly', 'weekly', 'custom']).optional(),
  custom_days: z.array(z.string()).optional(),
  
  // Billing
  billing_cycle: z.string().optional(),
  
  // Legacy field names (for backwards compatibility)
  daily_prompt_time: z.string().optional(),
  email_notifications: z.boolean().optional(),
  reminder_enabled: z.boolean().optional(),
}).passthrough()

/**
 * GET /api/user/preferences
 * Get user preferences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const result = await getUserPreferences(user.id)

    if (result.error) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      data: result.preferences
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/preferences
 * Update user preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input with Zod
    const parsed = UserPreferencesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await upsertUserPreferences(user.id, parsed.data)

    if (result.error) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: result.preferences
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
