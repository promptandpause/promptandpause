import { createServiceRoleClient } from '@/lib/supabase/server'
import { WeeklyDigest, MoodType } from '@/lib/types/reflection'

/**
 * Server-Side Analytics Service for Prompt & Pause
 * 
 * This version uses server-side Supabase client for direct database access.
 * Used by API routes to ensure fresh, real-time data for weekly digests and emails.
 * 
 * For client-side components, use analyticsService.ts instead.
 */

// =============================================================================
// STREAK CALCULATIONS (SERVER-SIDE)
// =============================================================================

/**
 * Calculate user's current reflection streak (server-side with fresh data)
 * 
 * @param userId - Supabase user ID
 * @returns Promise with current streak count
 */
export async function calculateReflectionStreakServer(userId: string): Promise<number> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data: reflections, error } = await supabase
      .from('reflections')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error || !reflections || reflections.length === 0) return 0

    const today = new Date()
    let streak = 0

    // Check each day backwards from today
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const hasReflection = reflections.some(r => r.date === dateStr)
      
      if (hasReflection) {
        streak++
      } else if (i > 0) {
        // Stop counting if we hit a day without reflection
        // (but allow today to be empty for current streak)
        break
      }
    }

    return streak
  } catch (error) {
    return 0
  }
}

// =============================================================================
// MOOD ANALYSIS (SERVER-SIDE)
// =============================================================================

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

// Valid mood emojis
const VALID_MOODS = new Set(['😔', '😐', '🤔', '😊', '😄', '😌', '🙏', '💪'])

/**
 * Validates and returns a valid mood, or a default if invalid
 */
function validateMood(mood: any): MoodType {
  if (mood && VALID_MOODS.has(mood)) {
    return mood as MoodType
  }
  // Default to neutral mood if undefined or invalid
  return '😐'
}

/**
 * Calculate mood trend using time-based comparison
 * Compares the first third vs last third of the time period
 * This gives more dynamic and accurate trend detection
 */
function calculateMoodTrend(
  reflections: { date: string; mood: MoodType }[],
  totalDays: number
): 'improving' | 'declining' | 'stable' {
  if (reflections.length < 3) {
    return 'stable' // Not enough data for trend
  }

  // Get date range
  const dates = reflections.map(r => new Date(r.date).getTime())
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)
  const dateRange = maxDate - minDate

  // If date range is too small, fall back to count-based thirds
  if (dateRange < 2 * 24 * 60 * 60 * 1000) {
    const thirdSize = Math.floor(reflections.length / 3)
    const firstThird = reflections.slice(0, thirdSize)
    const lastThird = reflections.slice(-thirdSize)
    
    const firstAvg = firstThird.reduce((sum, r) => sum + (MOOD_SCORES[r.mood] || 3), 0) / firstThird.length
    const lastAvg = lastThird.reduce((sum, r) => sum + (MOOD_SCORES[r.mood] || 3), 0) / lastThird.length
    
    const diff = lastAvg - firstAvg
    if (diff > 0.2) return 'improving'
    if (diff < -0.2) return 'declining'
    return 'stable'
  }

  // Time-based comparison: first third vs last third of time period
  const thirdDuration = dateRange / 3
  const firstThirdEnd = minDate + thirdDuration
  const lastThirdStart = maxDate - thirdDuration

  const firstThird = reflections.filter(r => {
    const time = new Date(r.date).getTime()
    return time <= firstThirdEnd
  })

  const lastThird = reflections.filter(r => {
    const time = new Date(r.date).getTime()
    return time >= lastThirdStart
  })

  if (firstThird.length === 0 || lastThird.length === 0) {
    return 'stable'
  }

  // Calculate average scores
  const firstAvg = firstThird.reduce((sum, r) => sum + (MOOD_SCORES[r.mood] || 3), 0) / firstThird.length
  const lastAvg = lastThird.reduce((sum, r) => sum + (MOOD_SCORES[r.mood] || 3), 0) / lastThird.length

  // Calculate difference and trend
  const diff = lastAvg - firstAvg
  
  // Log trend calculation for debugging
  // Use a smaller threshold for more sensitive trend detection
  // 0.2 = about 1/5 of a mood level difference
  if (diff > 0.2) return 'improving'
  if (diff < -0.2) return 'declining'
  
  return 'stable'
}

/**
 * Calculate mood trends over specified period (server-side)
 */
export async function calculateMoodTrendsServer(
  userId: string,
  days: number = 30
): Promise<{
  overall: { mood: MoodType; count: number; percentage: number }[]
  daily: { date: string; mood: MoodType }[]
  mostCommon: MoodType | null
  trend: 'improving' | 'declining' | 'stable'
}> {
  try {
    const supabase = createServiceRoleClient()
    const today = new Date()
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    const startDateStr = startDate.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('reflections')
      .select('date,mood')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', todayStr)
      .order('date', { ascending: true })

    if (error) throw error

    const reflections = (data || []) as { date: string; mood: any }[]

    // Filter out and fix invalid moods
    const validReflections = reflections
      .filter(r => r.mood) // Remove null/undefined moods
      .map(r => ({ 
        date: r.date, 
        mood: validateMood(r.mood) 
      }))

    if (validReflections.length === 0) {
      return { overall: [], daily: [], mostCommon: null, trend: 'stable' }
    }

    const moodCounts: Record<string, number> = {}
    validReflections.forEach(r => { moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1 })

    const totalReflections = validReflections.length
    const overall = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood: mood as MoodType,
        count,
        percentage: Math.round((count / totalReflections) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    const daily = validReflections.map(r => ({ date: r.date, mood: r.mood }))

    const mostCommon = overall.length > 0 ? overall[0].mood : null

    // Calculate trend using time-based comparison (not just count-based)
    // Compare first third vs last third of the time period for more dynamic results
    const trend = calculateMoodTrend(validReflections, days)

    return { overall, daily, mostCommon, trend }
  } catch (error) {
    return { overall: [], daily: [], mostCommon: null, trend: 'stable' }
  }
}

// =============================================================================
// WEEKLY DIGEST (SERVER-SIDE)
// =============================================================================

/**
 * Generate weekly digest with comprehensive reflection summary (server-side with fresh data)
 * 
 * @param userId - Supabase user ID
 * @param startDate - Start date for digest period
 * @param endDate - End date for digest period
 * @returns Promise with weekly digest data
 */
export async function generateWeeklyDigestServer(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WeeklyDigest> {
  try {
    const supabase = createServiceRoleClient()
    
    // Default to last 7 days if no dates provided
    const end = endDate || new Date()
    const start = startDate || new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)

    const weekStartStr = start.toISOString().split('T')[0]
    const weekEndStr = end.toISOString().split('T')[0]

    // Fetch week's reflections directly from database with fresh data
    const { data: weekReflections, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .order('date', { ascending: false })
    
    if (error) {
      throw error
    }
    
    const reflections = weekReflections || []

    // Calculate top tags
    const tagCounts: Record<string, number> = {}
    reflections.forEach(r => {
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate mood distribution - validate and filter moods
    const moodCounts: Record<string, number> = {}
    reflections.forEach(r => {
      if (r.mood) {
        const validMood = validateMood(r.mood)
        moodCounts[validMood] = (moodCounts[validMood] || 0) + 1
      }
    })
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood as MoodType,
      count,
    }))

    // Calculate average word count
    const totalWords = reflections.reduce((sum, r) => sum + (r.word_count || 0), 0)
    const averageWordCount = reflections.length > 0 
      ? Math.round(totalWords / reflections.length) 
      : 0

    // Get reflection summaries
    const { decryptIfEncrypted } = await import('@/lib/utils/crypto')
    const reflectionSummaries = reflections.slice(0, 7).map(r => {
      const raw = r.reflection_text || ''
      const plain = decryptIfEncrypted(raw) || raw
      return {
        date: r.date,
        prompt: r.prompt_text,
        snippet: plain.slice(0, 100) + (plain.length > 100 ? '...' : ''),
      }
    })

    // Get current streak - calculated fresh from database
    const currentStreak = await calculateReflectionStreakServer(userId)

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      totalReflections: reflections.length,
      topTags,
      moodDistribution,
      averageWordCount,
      currentStreak,
      reflectionSummaries,
    }
  } catch (error) {
    // Return empty digest on error
    const end = endDate || new Date()
    const start = startDate || new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
    return {
      weekStart: start.toISOString().split('T')[0],
      weekEnd: end.toISOString().split('T')[0],
      totalReflections: 0,
      topTags: [],
      moodDistribution: [],
      averageWordCount: 0,
      currentStreak: 0,
      reflectionSummaries: [],
    }
  }
}
