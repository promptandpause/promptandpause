import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/services/userService'
import { setFocusOverride, ALL_FOCUS_AREA_NAMES } from '@/lib/services/focusAreaRotationService'

/**
 * POST /api/focus/override
 * 
 * Premium feature: Set a manual focus area override for today's prompt.
 * 
 * Body:
 * - focusArea: string | null (null to clear override)
 * - duration: 'today' | 'until_cleared' (default: 'today')
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check premium status
    const { tier } = await getUserTier(user.id)
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Premium feature',
          message: 'Manual focus tuning is a premium feature. Upgrade to access this feature.'
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { focusArea, duration = 'today' } = body

    // Validate duration
    if (duration !== 'today' && duration !== 'until_cleared') {
      return NextResponse.json(
        { success: false, error: 'Invalid duration. Must be "today" or "until_cleared"' },
        { status: 400 }
      )
    }

    // Validate focus area if provided
    if (focusArea !== null && focusArea !== undefined) {
      const isValid = ALL_FOCUS_AREA_NAMES.some(
        n => n.toLowerCase() === String(focusArea).toLowerCase()
      )
      if (!isValid) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid focus area: ${focusArea}`,
            validOptions: ALL_FOCUS_AREA_NAMES
          },
          { status: 400 }
        )
      }
    }

    // Set or clear the override
    const result = await setFocusOverride(user.id, focusArea ?? null, duration)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        focusArea: focusArea ?? null,
        duration: focusArea ? duration : null,
        message: focusArea 
          ? `Focus override set to "${focusArea}" ${duration === 'today' ? 'for today' : 'until cleared'}`
          : 'Focus override cleared - returning to automatic rotation'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/focus/override
 * 
 * Get current focus override status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current override from user_preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('focus_override_area, focus_override_until, focus_override_set_at')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch override status' },
        { status: 500 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const isActive = data?.focus_override_area && 
      (!data.focus_override_until || data.focus_override_until >= today)

    return NextResponse.json({
      success: true,
      data: {
        hasOverride: isActive,
        focusArea: isActive ? data.focus_override_area : null,
        until: isActive ? data.focus_override_until : null,
        setAt: isActive ? data.focus_override_set_at : null,
        availableAreas: ALL_FOCUS_AREA_NAMES
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/focus/override
 * 
 * Clear focus override (convenience method)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await setFocusOverride(user.id, null, 'today')

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Focus override cleared - returning to automatic rotation'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
