import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reflections/stats
 * 
 * Returns reflection counts for the authenticated user:
 * - today: reflections created in the last 24 hours
 * - last7Days: reflections created in the last 7 days
 * - total: total reflections for the user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
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

    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // Fetch all counts in parallel
    const [todayResult, last7Result, totalResult] = await Promise.all([
      // Today's reflections
      supabase
        .from('reflections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`),

      // Last 7 days reflections
      supabase
        .from('reflections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${sevenDaysAgo}T00:00:00Z`),

      // Total reflections
      supabase
        .from('reflections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        today: todayResult.count || 0,
        last7Days: last7Result.count || 0,
        total: totalResult.count || 0,
      },
    })
  } catch (error) {
    console.error('Unexpected error in /api/reflections/stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
