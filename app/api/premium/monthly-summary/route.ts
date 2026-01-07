import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/premium/monthly-summary
 * Returns the most recent monthly reflection summary for the authenticated premium user.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 })
    }

    if (profile.subscription_tier !== 'premium' || profile.subscription_status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Monthly summaries are a premium feature', requiresPremium: true },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('monthly_reflection_summaries')
      .select('month_start, month_end, overview_text, observations, theme_reflection, closing_question, created_at, updated_at')
      .eq('user_id', user.id)
      .order('month_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch monthly summary' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data
        ? {
            monthStart: data.month_start,
            monthEnd: data.month_end,
            overviewText: data.overview_text,
            observations: data.observations,
            themeReflection: data.theme_reflection,
            closingQuestion: data.closing_question,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }
        : null,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
