import { supabaseReflectionService } from './supabaseReflectionService'
import { Reflection, WeeklyDigest, DailyActivity, MoodType } from '@/lib/types/reflection'

/**
 * Analytics Service for Prompt & Pause
 * 
 * Handles all analytics, statistics, and insights generation for user reflections.
 * Focuses on data processing and calculations, using supabaseReflectionService for data fetching.
 * 
 * NOTE: This is the CLIENT-SIDE version. For server-side (API routes), use analyticsServiceServer.ts
 */

// =============================================================================
// STREAK CALCULATIONS
// =============================================================================

/**
 * Calculate user's current reflection streak
 * 
 * @param userId - Supabase user ID
 * @returns Promise with current streak count
 */
export async function calculateReflectionStreak(userId: string): Promise<number> {
  try {
    const reflections = await supabaseReflectionService.getAllReflections()
    
    if (reflections.length === 0) return 0

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
    console.error('Error calculating reflection streak:', error)
    return 0
  }
}

/**
 * Calculate longest streak the user has ever achieved
 * 
 * @param userId - Supabase user ID
 * @returns Promise with longest streak count
 */
export async function calculateLongestStreak(userId: string): Promise<number> {
  try {
    const reflections = await supabaseReflectionService.getAllReflections()
    
    if (reflections.length === 0) return 0

    // Sort reflections by date
    const sortedReflections = [...reflections].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let longestStreak = 0
    let currentStreak = 1

    for (let i = 1; i < sortedReflections.length; i++) {
      const prevDate = new Date(sortedReflections[i - 1].date)
      const currDate = new Date(sortedReflections[i].date)
      
      // Calculate day difference
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (dayDiff === 1) {
        // Consecutive day
        currentStreak++
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, currentStreak)
        currentStreak = 1
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak)
    return longestStreak
  } catch (error) {
    console.error('Error calculating longest streak:', error)
    return 0
  }
}

// =============================================================================
// WEEKLY DIGEST
// =============================================================================

/**
 * Generate weekly digest with comprehensive reflection summary
 * 
 * @param userId - Supabase user ID
 * @param startDate - Start date for digest period
 * @param endDate - End date for digest period
 * @returns Promise with weekly digest data
 */
export async function generateWeeklyDigest(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WeeklyDigest> {
  try {
    // Default to last 7 days if no dates provided
    const end = endDate || new Date()
    const start = startDate || new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)

    const weekStartStr = start.toISOString().split('T')[0]
    const weekEndStr = end.toISOString().split('T')[0]

    const weekReflections = await supabaseReflectionService.getReflectionsByDateRange(
      weekStartStr,
      weekEndStr
    )

    // Calculate top tags
    const tagCounts: Record<string, number> = {}
    weekReflections.forEach(r => {
      r.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate mood distribution
    const moodCounts: Record<string, number> = {}
    weekReflections.forEach(r => {
      moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1
    })
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood as MoodType,
      count,
    }))

    // Calculate average word count
    const totalWords = weekReflections.reduce((sum, r) => sum + r.word_count, 0)
    const averageWordCount = weekReflections.length > 0 
      ? Math.round(totalWords / weekReflections.length) 
      : 0

    // Get reflection summaries
    const reflectionSummaries = weekReflections.slice(0, 7).map(r => ({
      date: r.date,
      prompt: r.prompt_text,
      snippet: r.reflection_text.slice(0, 100) + (r.reflection_text.length > 100 ? '...' : ''),
    }))

    // Get current streak
    const currentStreak = await calculateReflectionStreak(userId)

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      totalReflections: weekReflections.length,
      topTags,
      moodDistribution,
      averageWordCount,
      currentStreak,
      reflectionSummaries,
    }
  } catch (error) {
    console.error('Error generating weekly digest:', error)
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

// =============================================================================
// DAILY ACTIVITY & CALENDAR DATA
// =============================================================================

/**
 * Get daily activity for calendar visualization
 * 
 * @param userId - Supabase user ID
 * @param startDate - Start date for activity range
 * @param endDate - End date for activity range
 * @returns Promise with daily activity data
 */
export async function getDailyActivity(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DailyActivity[]> {
  try {
    // Default to last 90 days
    const end = endDate || new Date()
    const start = startDate || new Date(end.getTime() - 89 * 24 * 60 * 60 * 1000)

    const startDateStr = start.toISOString().split('T')[0]
    const endDateStr = end.toISOString().split('T')[0]

    const reflections = await supabaseReflectionService.getReflectionsByDateRange(
      startDateStr,
      endDateStr
    )

    // Create a map of date -> reflections
    const reflectionsByDate: Record<string, Reflection[]> = {}
    reflections.forEach(r => {
      if (!reflectionsByDate[r.date]) {
        reflectionsByDate[r.date] = []
      }
      reflectionsByDate[r.date].push(r)
    })

    // Build activity array for each day
    const activities: DailyActivity[] = []
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayReflections = reflectionsByDate[dateStr] || []
      const moods = dayReflections.map(r => r.mood)

      activities.push({
        date: dateStr,
        count: dayReflections.length,
        moods,
      })
    }

    return activities
  } catch (error) {
    console.error('Error getting daily activity:', error)
    return []
  }
}

// =============================================================================
// TAG ANALYSIS
// =============================================================================

/**
 * Get most frequently used tags across all reflections
 * 
 * @param userId - Supabase user ID
 * @param limit - Maximum number of tags to return (default: 10)
 * @returns Promise with tag frequencies
 */
export async function getMostUsedTags(
  userId: string,
  limit: number = 10
): Promise<{ tag: string; count: number }[]> {
  try {
    const reflections = await supabaseReflectionService.getAllReflections()
    const tagCounts: Record<string, number> = {}

    reflections.forEach(r => {
      r.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting most used tags:', error)
    return []
  }
}

/**
 * Get tag trends over time (comparing two periods)
 * 
 * @param userId - Supabase user ID
 * @param days - Number of days per period (default: 30)
 * @returns Promise with tag trends
 */
export async function getTagTrends(
  userId: string,
  days: number = 30
): Promise<{
  tag: string
  currentCount: number
  previousCount: number
  percentChange: number
}[]> {
  try {
    const today = new Date()
    
    // Current period
    const currentStart = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    const currentStartStr = currentStart.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]
    
    // Previous period
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStartStr = previousStart.toISOString().split('T')[0]
    const previousEndStr = currentStartStr

    const currentReflections = await supabaseReflectionService.getReflectionsByDateRange(
      currentStartStr,
      todayStr
    )
    const previousReflections = await supabaseReflectionService.getReflectionsByDateRange(
      previousStartStr,
      previousEndStr
    )

    // Count tags in both periods
    const currentTags: Record<string, number> = {}
    const previousTags: Record<string, number> = {}

    currentReflections.forEach(r => {
      r.tags.forEach(tag => {
        currentTags[tag] = (currentTags[tag] || 0) + 1
      })
    })

    previousReflections.forEach(r => {
      r.tags.forEach(tag => {
        previousTags[tag] = (previousTags[tag] || 0) + 1
      })
    })

    // Calculate trends for all tags
    const allTags = new Set([...Object.keys(currentTags), ...Object.keys(previousTags)])
    const trends = Array.from(allTags).map(tag => {
      const currentCount = currentTags[tag] || 0
      const previousCount = previousTags[tag] || 0
      const percentChange = previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : currentCount > 0 ? 100 : 0

      return {
        tag,
        currentCount,
        previousCount,
        percentChange: Math.round(percentChange),
      }
    })

    return trends.sort((a, b) => b.currentCount - a.currentCount)
  } catch (error) {
    console.error('Error calculating tag trends:', error)
    return []
  }
}

// =============================================================================
// MOOD ANALYSIS
// =============================================================================

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
 * Calculate mood trend using time-based comparison (client-side)
 * Matches the server-side logic for consistency
 */
function calculateMoodTrendClient(
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
  
  console.log('Mood Trend Calculation (Client):', {
    totalReflections: reflections.length,
    firstThirdCount: firstThird.length,
    lastThirdCount: lastThird.length,
    firstAvg: firstAvg.toFixed(2),
    lastAvg: lastAvg.toFixed(2),
    difference: diff.toFixed(2),
    trend: diff > 0.2 ? 'improving' : diff < -0.2 ? 'declining' : 'stable'
  })
  
  // Use a smaller threshold for more sensitive trend detection
  // 0.2 = about 1/5 of a mood level difference
  if (diff > 0.2) return 'improving'
  if (diff < -0.2) return 'declining'
  
  return 'stable'
}

/**
 * Calculate mood trends over specified period
 * 
 * @param userId - Supabase user ID
 * @param days - Number of days to analyze (default: 30)
 * @returns Promise with mood distribution and trends
 */
export async function calculateMoodTrends(
  userId: string,
  days: number = 30
): Promise<{
  overall: { mood: MoodType; count: number; percentage: number }[]
  daily: { date: string; mood: MoodType }[]
  mostCommon: MoodType | null
  trend: 'improving' | 'declining' | 'stable'
}> {
  try {
    const today = new Date()
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    const startDateStr = startDate.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    const reflections = await supabaseReflectionService.getReflectionsByDateRange(
      startDateStr,
      todayStr
    )

    if (reflections.length === 0) {
      return {
        overall: [],
        daily: [],
        mostCommon: null,
        trend: 'stable',
      }
    }

    // Calculate overall mood distribution
    const moodCounts: Record<string, number> = {}
    reflections.forEach(r => {
      moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1
    })

    const totalReflections = reflections.length
    const overall = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood: mood as MoodType,
        count,
        percentage: Math.round((count / totalReflections) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    // Get daily moods
    const daily = reflections.map(r => ({
      date: r.date,
      mood: r.mood,
    }))

    // Find most common mood
    const mostCommon = overall.length > 0 ? overall[0].mood : null

    // Calculate trend using time-based comparison (matches server-side logic)
    const trend = calculateMoodTrendClient(daily, days)

    return {
      overall,
      daily,
      mostCommon,
      trend,
    }
  } catch (error) {
    console.error('Error calculating mood trends:', error)
    return {
      overall: [],
      daily: [],
      mostCommon: null,
      trend: 'stable',
    }
  }
}

// =============================================================================
// INSIGHTS & PATTERNS
// =============================================================================

/**
 * Generate personalized insights from user's reflection patterns
 * 
 * @param userId - Supabase user ID
 * @returns Promise with actionable insights
 */
export async function getReflectionInsights(
  userId: string
): Promise<{
  insights: string[]
  highlights: {
    strongestDay: string | null
    preferredReflectionTime: string | null
    consistencyScore: number
  }
}> {
  try {
    const reflections = await supabaseReflectionService.getAllReflections()
    const insights: string[] = []

    if (reflections.length === 0) {
      return {
        insights: ['Start your reflection journey today! Write your first reflection to begin tracking your emotional wellness.'],
        highlights: {
          strongestDay: null,
          preferredReflectionTime: null,
          consistencyScore: 0,
        },
      }
    }

    // Calculate day of week patterns
    const dayOfWeekCounts: Record<number, number> = {}
    reflections.forEach(r => {
      const dayOfWeek = new Date(r.date).getDay()
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
    })

    const strongestDay = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])[0]
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const strongestDayName = dayNames[parseInt(strongestDay[0])]

    // Calculate consistency score (percentage of days with reflections in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]

    const recentReflections = await supabaseReflectionService.getReflectionsByDateRange(
      thirtyDaysAgoStr,
      todayStr
    )
    const consistencyScore = Math.round((recentReflections.length / 30) * 100)

    // Generate insights based on patterns
    if (consistencyScore >= 80) {
      insights.push('🌟 Amazing consistency! You\'ve been reflecting regularly and building a strong mindfulness habit.')
    } else if (consistencyScore >= 50) {
      insights.push('👍 You\'re making good progress! Try to maintain your reflection routine for even better insights.')
    } else if (consistencyScore >= 20) {
      insights.push('💡 You\'re on your way! Consider setting a daily reminder to help build your reflection habit.')
    } else {
      insights.push('🌱 Every journey starts somewhere! Try reflecting at the same time each day to build momentum.')
    }

    if (strongestDay[1] >= 3) {
      insights.push(`📅 ${strongestDayName}s seem to work well for you! You reflect most often on this day.`)
    }

    // Word count insights
    const avgWordCount = Math.round(
      reflections.reduce((sum, r) => sum + r.word_count, 0) / reflections.length
    )
    if (avgWordCount > 200) {
      insights.push('✍️ You write detailed reflections! This depth helps you process emotions more thoroughly.')
    } else if (avgWordCount < 50) {
      insights.push('💭 Try writing a bit more in your reflections. Even an extra sentence can deepen your insights.')
    }

    // Streak insights
    const currentStreak = await calculateReflectionStreak(userId)
    if (currentStreak >= 7) {
      insights.push(`🔥 You\'re on a ${currentStreak}-day streak! Keep the momentum going!`)
    } else if (currentStreak >= 3) {
      insights.push(`🎯 ${currentStreak} days in a row! You\'re building a great habit.`)
    }

    return {
      insights,
      highlights: {
        strongestDay: strongestDayName,
        preferredReflectionTime: null, // Would need time data in database
        consistencyScore,
      },
    }
  } catch (error) {
    console.error('Error generating reflection insights:', error)
    return {
      insights: ['Unable to generate insights at this time. Keep reflecting to build your data!'],
      highlights: {
        strongestDay: null,
        preferredReflectionTime: null,
        consistencyScore: 0,
      },
    }
  }
}

/**
 * Calculate writing quality metrics
 * 
 * @param userId - Supabase user ID
 * @returns Promise with writing metrics
 */
export async function calculateWritingMetrics(
  userId: string
): Promise<{
  averageWordCount: number
  totalWords: number
  shortestReflection: number
  longestReflection: number
  trend: 'increasing' | 'decreasing' | 'stable'
}> {
  try {
    const reflections = await supabaseReflectionService.getAllReflections()

    if (reflections.length === 0) {
      return {
        averageWordCount: 0,
        totalWords: 0,
        shortestReflection: 0,
        longestReflection: 0,
        trend: 'stable',
      }
    }

    const wordCounts = reflections.map(r => r.word_count)
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0)
    const averageWordCount = Math.round(totalWords / reflections.length)
    const shortestReflection = Math.min(...wordCounts)
    const longestReflection = Math.max(...wordCounts)

    // Determine trend
    const midpoint = Math.floor(reflections.length / 2)
    const firstHalfAvg = reflections.slice(0, midpoint)
      .reduce((sum, r) => sum + r.word_count, 0) / midpoint
    const secondHalfAvg = reflections.slice(midpoint)
      .reduce((sum, r) => sum + r.word_count, 0) / (reflections.length - midpoint)

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    const difference = secondHalfAvg - firstHalfAvg
    if (difference > 20) trend = 'increasing'
    else if (difference < -20) trend = 'decreasing'

    return {
      averageWordCount,
      totalWords,
      shortestReflection,
      longestReflection,
      trend,
    }
  } catch (error) {
    console.error('Error calculating writing metrics:', error)
    return {
      averageWordCount: 0,
      totalWords: 0,
      shortestReflection: 0,
      longestReflection: 0,
      trend: 'stable',
    }
  }
}
