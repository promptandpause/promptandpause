import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateMoodTrendsServer } from '@/lib/services/analyticsServiceServer'
import { getUserTier } from '@/lib/utils/tierManagement'
import { MoodType } from '@/lib/types/reflection'

// Mood scores for trend calculation
const MOOD_SCORES: Record<string, number> = {
  '😔': 1,
  '😐': 2,
  '🤔': 3,
  '😊': 4,
  '😄': 5,
  '😌': 4,
  '🙏': 4,
  '💪': 5,
}

/**
 * GET /api/premium/mood-analytics
 * 
 * Get advanced mood analytics with charts data
 * Premium feature only
 * 
 * Query params:
 * - days: number - Number of days to analyze (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const tier = getUserTier(profile.subscription_status, profile.subscription_tier)
    
    if (tier !== 'premium') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mood analytics is a premium feature',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Days must be between 1 and 365' },
        { status: 400 }
      )
    }
    // Calculate mood trends
    const moodTrends = await calculateMoodTrendsServer(user.id, days)

    // Calculate additional metrics
    const weeklyAverage = calculateAverageScore(moodTrends.daily.slice(-7))
    const monthlyAverage = calculateAverageScore(moodTrends.daily.slice(-30))

    // Transform data for charts
    const dailyWithScores = moodTrends.daily.map(item => ({
      date: item.date,
      mood: item.mood,
      score: MOOD_SCORES[item.mood] || 3,
    }))

    const analyticsData = {
      overall: moodTrends.overall,
      daily: dailyWithScores,
      mostCommon: moodTrends.mostCommon,
      trend: moodTrends.trend,
      weeklyAverage,
      monthlyAverage,
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch mood analytics' 
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate average mood score from daily data
 */
function calculateAverageScore(dailyData: { date: string; mood: MoodType }[]): number {
  if (dailyData.length === 0) return 0
  
  const total = dailyData.reduce((sum, item) => {
    return sum + (MOOD_SCORES[item.mood] || 3)
  }, 0)
  
  return total / dailyData.length
}
