import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPreferences, upsertUserPreferences } from '@/lib/services/userService'

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
    console.error('Error fetching preferences:', error)
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

    const result = await upsertUserPreferences(user.id, body)

    if (result.error) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: result.preferences
    })
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
