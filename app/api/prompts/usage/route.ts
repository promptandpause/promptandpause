import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/prompts/usage
 * 
 * Returns the current week's prompt generation usage for the authenticated user.
 * Used by the frontend to display remaining prompts and enforce limits dynamically.
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

    // Check subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, billing_cycle')
      .eq('id', user.id)
      .single()

    const isPremium = profile?.subscription_status === 'premium' || profile?.billing_cycle === 'gift_trial'

    if (isPremium) {
      return NextResponse.json({
        success: true,
        data: {
          isPremium: true,
          used: 0,
          limit: -1, // unlimited
          remaining: -1,
          resetDate: null,
        },
      })
    }

    // Calculate start of current week (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Count prompts GENERATED this week (from prompts_history, not reflections)
    const { data: weeklyPrompts, error: weeklyError } = await supabase
      .from('prompts_history')
      .select('id')
      .eq('user_id', user.id)
      .gte('date_generated', weekStartStr)

    const used = weeklyError ? 0 : (weeklyPrompts?.length || 0)
    const limit = 3
    const remaining = Math.max(0, limit - used)

    // Calculate next Monday
    const nextMonday = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const resetDate = nextMonday.toISOString().split('T')[0]
    const resetLabel = nextMonday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

    return NextResponse.json({
      success: true,
      data: {
        isPremium: false,
        used,
        limit,
        remaining,
        resetDate,
        resetLabel,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
