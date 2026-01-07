import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPreferences, upsertUserPreferences } from '@/lib/services/userService'
import { z } from 'zod'

// Zod schema for user preferences
const UserPreferencesSchema = z.object({
  timezone: z.string().optional(),
  language: z.string().optional(),
  daily_prompt_time: z.string().optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  reminder_enabled: z.boolean().optional(),
  reminder_time: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional()
}).refine(
  (data) => {
    // If reminder_enabled is true, reminder_time must be provided
    if (data.reminder_enabled === true && !data.reminder_time) {
      return false
    }
    return true
  },
  {
    message: 'reminder_time is required when reminder_enabled is true',
    path: ['reminder_time']
  }
)

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
