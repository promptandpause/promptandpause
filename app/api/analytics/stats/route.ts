import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateReflectionStreak, calculateLongestStreak } from '@/lib/services/analyticsService'

/**
 * GET /api/analytics/stats
 * Get user statistics (streak, total reflections, mood trends, etc.)
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

    // Get basic reflection count
    const { count: totalReflections } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get statistics
    const [currentStreak, longestStreak] = await Promise.all([
      calculateReflectionStreak(user.id),
      calculateLongestStreak(user.id)
    ])

    return NextResponse.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalReflections: totalReflections || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
