import { SupabaseClient } from '@supabase/supabase-js'

export interface MoodInsight {
  id: string
  user_id: string
  period_type: 'weekly' | 'monthly' | 'yearly'
  period_start: string
  period_end: string
  average_mood: number
  mood_trend: 'improving' | 'stable' | 'declining'
  total_reflections: number
  top_emotions: string[]
  insights: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WeeklyMoodData {
  date: string
  mood: number | null
  hasReflection: boolean
}

export interface MoodCorrelation {
  factor: string
  correlation: number // -1 to 1
  description: string
}

// Shared emoji → numeric score mapping
const MOOD_SCORE: Record<string, number> = {
  "😔": 2, "😐": 4, "🤔": 5, "😌": 6, "😊": 7, "🙏": 8, "😄": 9, "💪": 9,
}
function toMoodScore(mood: unknown): number | null {
  if (typeof mood === 'number') return mood
  if (typeof mood === 'string') return MOOD_SCORE[mood] ?? null
  return null
}

/**
 * Get weekly mood data for chart display (Mon → Sun order)
 */
export async function getWeeklyMoodData(
  supabase: SupabaseClient,
  userId: string
): Promise<WeeklyMoodData[]> {
  const today = new Date()
  // Find this week's Monday
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - mondayOffset)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startDate = monday.toISOString().split('T')[0]
  const endDate = sunday.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reflections')
    .select('created_at, mood')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching weekly mood:', error)
    return []
  }

  // Build Mon-Sun array
  const weekData: WeeklyMoodData[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayReflections = data?.filter(r => 
      r.created_at.startsWith(dateStr)
    ) || []
    
    const scores = dayReflections.map(r => toMoodScore(r.mood)).filter((s): s is number => s !== null)
    const avgMood = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null

    weekData.push({
      date: dateStr,
      mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
      hasReflection: dayReflections.length > 0
    })
  }

  return weekData
}

/**
 * Get monthly mood data for chart display (last 30 days)
 */
export async function getMonthlyMoodData(
  supabase: SupabaseClient,
  userId: string
): Promise<WeeklyMoodData[]> {
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(today.getDate() - 29)
  
  const startDate = monthAgo.toISOString().split('T')[0]
  const endDate = today.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reflections')
    .select('created_at, mood')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching monthly mood:', error)
    return []
  }

  // Create array for last 30 days
  const monthData: WeeklyMoodData[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayReflections = data?.filter(r => 
      r.created_at.startsWith(dateStr)
    ) || []
    
    const scores = dayReflections.map(r => toMoodScore(r.mood)).filter((s): s is number => s !== null)
    const avgMood = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null

    monthData.push({
      date: dateStr,
      mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
      hasReflection: dayReflections.length > 0
    })
  }

  return monthData
}

/**
 * Calculate mood statistics for a period
 */
export async function getMoodStats(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<{
  averageMood: number | null
  totalReflections: number
  trend: 'improving' | 'stable' | 'declining'
  bestDay: string | null
  worstDay: string | null
  topEmotions: string[]
}> {
  const { data, error } = await supabase
    .from('reflections')
    .select('created_at, mood, tags')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: true })

  if (error || !data || data.length === 0) {
    return {
      averageMood: null,
      totalReflections: 0,
      trend: 'stable',
      bestDay: null,
      worstDay: null,
      topEmotions: []
    }
  }

  // Calculate average mood using shared toMoodScore
  const moodsWithValues = data.filter(r => r.mood !== null && toMoodScore(r.mood) !== null)
  const averageMood = moodsWithValues.length > 0
    ? moodsWithValues.reduce((sum, r) => sum + (toMoodScore(r.mood) ?? 0), 0) / moodsWithValues.length
    : null

  // Calculate trend (compare first half to second half)
  const midpoint = Math.floor(moodsWithValues.length / 2)
  const firstHalf = moodsWithValues.slice(0, midpoint)
  const secondHalf = moodsWithValues.slice(midpoint)
  
  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum, r) => sum + (toMoodScore(r.mood) ?? 0), 0) / firstHalf.length
    : 0
  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, r) => sum + (toMoodScore(r.mood) ?? 0), 0) / secondHalf.length
    : 0

  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (secondHalfAvg - firstHalfAvg > 0.5) trend = 'improving'
  else if (firstHalfAvg - secondHalfAvg > 0.5) trend = 'declining'

  // Find best and worst days
  const dayMoods: Record<string, { total: number; count: number }> = {}
  for (const r of moodsWithValues) {
    const day = new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'long' })
    if (!dayMoods[day]) dayMoods[day] = { total: 0, count: 0 }
    dayMoods[day].total += toMoodScore(r.mood) ?? 0
    dayMoods[day].count++
  }

  let bestDay: string | null = null
  let worstDay: string | null = null
  let bestAvg = -Infinity
  let worstAvg = Infinity

  for (const [day, stats] of Object.entries(dayMoods)) {
    const avg = stats.total / stats.count
    if (avg > bestAvg) {
      bestAvg = avg
      bestDay = day
    }
    if (avg < worstAvg) {
      worstAvg = avg
      worstDay = day
    }
  }

  // Get top feelings from actual mood emojis selected
  const moodEmojiLabels: Record<string, string> = {
    "😔": "Sad", "😐": "Neutral", "😊": "Happy", "😄": "Joyful",
    "🤔": "Thoughtful", "😌": "Calm", "🙏": "Grateful", "💪": "Strong",
  }
  const moodCounts: Record<string, number> = {}
  for (const r of moodsWithValues) {
    const mood = r.mood as string
    if (mood) {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1
    }
  }

  const topEmotions = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emoji]) => `${emoji} ${moodEmojiLabels[emoji] || emoji}`)

  return {
    averageMood: averageMood ? Math.round(averageMood * 10) / 10 : null,
    totalReflections: data.length,
    trend,
    bestDay,
    worstDay,
    topEmotions
  }
}

/**
 * Get reflection count by day of week
 */
export async function getReflectionsByDayOfWeek(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<Record<string, number>> {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days)

  const { data, error } = await supabase
    .from('reflections')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString().split('T')[0])

  if (error || !data) {
    return {}
  }

  const dayCounts: Record<string, number> = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0
  }

  for (const r of data) {
    const day = new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'long' })
    dayCounts[day]++
  }

  return dayCounts
}

/**
 * Generate AI-powered mood insights (Premium feature)
 */
export async function generateMoodInsights(
  supabase: SupabaseClient,
  userId: string,
  periodType: 'weekly' | 'monthly'
): Promise<string[]> {
  const days = periodType === 'weekly' ? 7 : 30
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days)

  const stats = await getMoodStats(
    supabase,
    userId,
    startDate.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  )

  const insights: string[] = []

  // Generate insights based on data
  if (stats.totalReflections === 0) {
    insights.push("Start reflecting to see your mood patterns emerge.")
    return insights
  }

  if (stats.averageMood !== null) {
    if (stats.averageMood >= 7) {
      insights.push(`Your average mood this ${periodType === 'weekly' ? 'week' : 'month'} is ${stats.averageMood}/10 - you're doing great!`)
    } else if (stats.averageMood >= 5) {
      insights.push(`Your average mood is ${stats.averageMood}/10 - steady and balanced.`)
    } else {
      insights.push(`Your average mood is ${stats.averageMood}/10 - consider what might help lift your spirits.`)
    }
  }

  if (stats.trend === 'improving') {
    insights.push("Your mood has been trending upward - keep doing what's working!")
  } else if (stats.trend === 'declining') {
    insights.push("Your mood has been trending down - this might be a good time for extra self-care.")
  }

  if (stats.bestDay && stats.worstDay && stats.bestDay !== stats.worstDay) {
    insights.push(`You tend to feel best on ${stats.bestDay}s and more challenged on ${stats.worstDay}s.`)
  }

  if (stats.topEmotions.length > 0) {
    insights.push(`Your most common feelings: ${stats.topEmotions.slice(0, 3).join(', ')}.`)
  }

  if (stats.totalReflections >= 5) {
    insights.push(`You've reflected ${stats.totalReflections} times - consistency builds self-awareness!`)
  }

  return insights
}
