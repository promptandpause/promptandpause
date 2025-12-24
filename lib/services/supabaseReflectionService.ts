import { getSupabaseClient } from '@/lib/supabase/client'
import { 
  Reflection, 
  MoodEntry, 
  WeeklyDigest, 
  DailyActivity, 
  MoodType,
  CreateReflectionInput 
} from '@/lib/types/reflection'

/**
 * Supabase-based Reflection Service
 * 
 * This replaces the localStorage-based reflectionService.
 * All operations now interact with Supabase database.
 */

// ============================================================================
// REFLECTION SERVICE
// ============================================================================

export const supabaseReflectionService = {
  /**
   * Get all reflections for the current user
   */
  async getAllReflections(): Promise<Reflection[]> {
    try {
      const res = await fetch('/api/reflections', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        return []
      }
      const text = await res.text()
      if (!text || !text.trim()) return []
      const json = JSON.parse(text)
      return json.data || []
    } catch (e) {
      return []
    }
  },

  /**
   * Get reflection by ID
   */
  async getReflectionById(id: string): Promise<Reflection | null> {
    try {
      const res = await fetch(`/api/reflections/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        if (res.status === 404) return null
        return null
      }
      const text = await res.text()
      if (!text || !text.trim()) return null
      const json = JSON.parse(text)
      return json.data || null
    } catch (e) {
      return null
    }
  },

  /**
   * Save a new reflection
   */
  async saveReflection(input: CreateReflectionInput): Promise<Reflection | null> {
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to save reflection')
      }
      const text = await res.text()
      if (!text || !text.trim()) return null
      const json = JSON.parse(text)
      return json.data || null
    } catch (e) {
      throw e
    }
  },

  /**
   * Update reflection feedback
   */
  async updateReflectionFeedback(
    id: string, 
    feedback: 'helped' | 'irrelevant'
  ): Promise<void> {
    try {
      const res = await fetch(`/api/reflections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to update feedback')
      }
    } catch (e) {
      throw e
    }
  },

  /**
   * Get reflections for a date range
   */
  async getReflectionsByDateRange(
    startDate: string, 
    endDate: string
  ): Promise<Reflection[]> {
    try {
      const url = `/api/reflections?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) {
        return []
      }
      const text = await res.text()
      if (!text || !text.trim()) return []
      const json = JSON.parse(text)
      return json.data || []
    } catch (e) {
      return []
    }
  },

  /**
   * Get today's reflection
   */
  async getTodaysReflection(): Promise<Reflection | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const url = `/api/reflections?startDate=${encodeURIComponent(today)}&endDate=${encodeURIComponent(today)}`
      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) {
        if (res.status === 404) return null
        return null
      }
      const text = await res.text()
      if (!text || !text.trim()) return null
      const json = JSON.parse(text)
      const items: Reflection[] = json.data || []
      return items[0] || null
    } catch (e) {
      return null
    }
  },

  /**
   * Delete a reflection
   */
  async deleteReflection(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/reflections/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to delete reflection')
      }
    } catch (e) {
      throw e
    }
  },
}

// ============================================================================
// MOOD SERVICE
// ============================================================================

export const supabaseMoodService = {
  /**
   * Get all moods for current user
   */
  async getAllMoods(): Promise<MoodEntry[]> {
    const supabase = getSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      return []
    }

    return data || []
  },

  /**
   * Save mood for a specific date
   */
  async saveMood(
    date: string, 
    mood: MoodType, 
    reflectionId?: string
  ): Promise<void> {
    const supabase = getSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const moodEntry = {
      user_id: user.id,
      date,
      mood,
      reflection_id: reflectionId || null,
    }

    // Upsert (insert or update if exists)
    const { error } = await supabase
      .from('moods')
      .upsert(moodEntry, { 
        onConflict: 'user_id,date',
        ignoreDuplicates: false 
      })

    if (error) {
      throw error
    }
  },

  /**
   * Get mood for specific date
   */
  async getMoodForDate(date: string): Promise<MoodEntry | null> {
    const supabase = getSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') {
    }

    return data || null
  },

  /**
   * Get moods for date range
   */
  async getMoodsByDateRange(
    startDate: string, 
    endDate: string
  ): Promise<MoodEntry[]> {
    const supabase = getSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) {
      return []
    }

    return data || []
  },
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export const supabaseAnalyticsService = {
  /**
   * Calculate current streak
   */
  async getCurrentStreak(): Promise<number> {
    const reflections = await supabaseReflectionService.getAllReflections()
    if (reflections.length === 0) return 0

    const today = new Date()
    let streak = 0

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const hasReflection = reflections.some(r => r.date === dateStr)
      if (hasReflection) {
        streak++
      } else if (i > 0) {
        // Stop counting if we hit a day without reflection (but allow today to be empty)
        break
      }
    }

    return streak
  },

  /**
   * Generate weekly digest
   */
  async getWeeklyDigest(): Promise<WeeklyDigest> {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)

    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = today.toISOString().split('T')[0]

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

    const currentStreak = await this.getCurrentStreak()

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
  },

  /**
   * Get daily activity for calendar
   */
  async getDailyActivity(days: number = 90): Promise<DailyActivity[]> {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days + 1)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = today.toISOString().split('T')[0]

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
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
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
  },

  /**
   * Get most used tags (all time)
   */
  async getMostUsedTags(limit: number = 10): Promise<{ tag: string; count: number }[]> {
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
  },
}
