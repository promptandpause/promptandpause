import { Reflection, MoodEntry, WeeklyDigest, DailyActivity, MoodType } from "@/lib/types/reflection"

const REFLECTIONS_KEY = "pp_reflections"
const MOODS_KEY = "pp_moods"

// Helper to safely access localStorage
const isClient = typeof window !== "undefined"

/**
 * Reflection Service (localStorage-based)
 * 
 * @deprecated This service uses localStorage and is maintained for legacy/demo support only.
 * For production use, migrate to `supabaseReflectionService` from '@/lib/services/supabaseReflectionService'.
 * 
 * All functions in this service will be removed in a future version.
 * Migration guide: Replace calls to reflectionService with supabaseReflectionService.
 * 
 * @see {@link supabaseReflectionService} for Supabase-based implementation
 */
export const reflectionService = {
  /**
   * Get all reflections
   * @deprecated Use supabaseReflectionService.getAllReflections() instead
   */
  getAllReflections(): Reflection[] {
    if (process.env.NODE_ENV === 'development') {
    }
    if (!isClient) return []
    const data = localStorage.getItem(REFLECTIONS_KEY)
    return data && data.trim() !== '' ? JSON.parse(data) : []
  },

  /**
   * Get reflection by ID
   * @deprecated Use supabaseReflectionService.getReflectionById() instead
   */
  getReflectionById(id: string): Reflection | null {
    if (process.env.NODE_ENV === 'development') {
    }
    const reflections = this.getAllReflections()
    return reflections.find(r => r.id === id) || null
  },

  /**
   * Save a new reflection
   * @deprecated Use supabaseReflectionService.saveReflection() instead
   */
  saveReflection(reflection: Omit<Reflection, "id" | "createdAt" | "wordCount">): Reflection {
    if (process.env.NODE_ENV === 'development') {
    }
    if (!isClient) throw new Error("Cannot save in non-client environment")
    
    const reflections = this.getAllReflections()
    const newReflection: Reflection = {
      ...reflection,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      word_count: reflection.reflection_text.split(/\s+/).filter(Boolean).length,
    }
    
    reflections.unshift(newReflection) // Add to beginning
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections))
    
    return newReflection
  },

  /**
   * Update reflection feedback
   * @deprecated Use supabaseReflectionService.updateReflectionFeedback() instead
   */
  updateReflectionFeedback(id: string, feedback: "helped" | "irrelevant"): void {
    if (process.env.NODE_ENV === 'development') {
    }
    if (!isClient) return
    
    const reflections = this.getAllReflections()
    const index = reflections.findIndex(r => r.id === id)
    if (index !== -1) {
      reflections[index].feedback = feedback
      localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections))
    }
  },

  /**
   * Get reflections for a specific date range
   * @deprecated Use supabaseReflectionService.getReflectionsByDateRange() instead
   */
  getReflectionsByDateRange(startDate: string, endDate: string): Reflection[] {
    if (process.env.NODE_ENV === 'development') {
    }
    const reflections = this.getAllReflections()
    return reflections.filter(r => r.date >= startDate && r.date <= endDate)
  },

  /**
   * Get today's reflection
   * @deprecated Use supabaseReflectionService.getTodaysReflection() instead
   */
  getTodaysReflection(): Reflection | null {
    if (process.env.NODE_ENV === 'development') {
    }
    const today = new Date().toISOString().split("T")[0]
    const reflections = this.getAllReflections()
    return reflections.find(r => r.date === today) || null
  },

  /**
   * Delete reflection
   * @deprecated Use supabaseReflectionService.deleteReflection() instead
   */
  deleteReflection(id: string): void {
    if (process.env.NODE_ENV === 'development') {
    }
    if (!isClient) return
    
    const reflections = this.getAllReflections()
    const filtered = reflections.filter(r => r.id !== id)
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(filtered))
  },
}

/**
 * Mood Service (localStorage-based)
 * 
 * @deprecated This service uses localStorage and is maintained for legacy/demo support only.
 * For production use, migrate to `supabaseMoodService` from '@/lib/services/supabaseReflectionService'.
 * 
 * @see {@link supabaseMoodService} for Supabase-based implementation
 */
export const moodService = {
  /**
   * Get all mood entries
   * @deprecated Use supabaseMoodService.getAllMoods() instead
   */
  getAllMoods(): MoodEntry[] {
    if (process.env.NODE_ENV === 'development') {
    }
    if (!isClient) return []
    const data = localStorage.getItem(MOODS_KEY)
    return data && data.trim() !== '' ? JSON.parse(data) : []
  },

  /**
   * Save mood for a specific date
   * @deprecated Use supabaseMoodService.saveMood() instead
   */
  saveMood(date: string, mood: MoodType, reflectionId?: string): void {
    if (process.env.NODE_ENV === 'development') {
    }
    if (!isClient) return
    
    const moods = this.getAllMoods()
    const existingIndex = moods.findIndex(m => m.date === date)

    const moodEntry: MoodEntry = {
      id: crypto.randomUUID(),
      user_id: 'local', // Placeholder for localStorage
      date,
      mood,
      reflection_id: reflectionId || null,
      created_at: new Date().toISOString(),
    }
    
    if (existingIndex !== -1) {
      moods[existingIndex] = moodEntry
    } else {
      moods.push(moodEntry)
    }
    
    localStorage.setItem(MOODS_KEY, JSON.stringify(moods))
  },

  /**
   * Get mood for specific date
   * @deprecated Use supabaseMoodService.getMoodForDate() instead
   */
  getMoodForDate(date: string): MoodEntry | null {
    if (process.env.NODE_ENV === 'development') {
    }
    const moods = this.getAllMoods()
    return moods.find(m => m.date === date) || null
  },

  /**
   * Get moods for date range
   * @deprecated Use supabaseMoodService.getMoodsByDateRange() instead
   */
  getMoodsByDateRange(startDate: string, endDate: string): MoodEntry[] {
    if (process.env.NODE_ENV === 'development') {
    }
    const moods = this.getAllMoods()
    return moods.filter(m => m.date >= startDate && m.date <= endDate)
  },
}

/**
 * Analytics Service (localStorage-based)
 * 
 * @deprecated This service uses localStorage and is maintained for legacy/demo support only.
 * For production use, migrate to `analyticsService` from '@/lib/services/analyticsService'.
 * 
 * @see {@link analyticsService} for Supabase-based implementation
 */
export const analyticsService = {
  /**
   * Calculate current streak
   * @deprecated Use analyticsService.calculateReflectionStreak() instead
   */
  getCurrentStreak(): number {
    if (process.env.NODE_ENV === 'development') {
    }
    const reflections = reflectionService.getAllReflections()
    if (reflections.length === 0) return 0
    
    const today = new Date()
    let streak = 0
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split("T")[0]
      
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
   * @deprecated Use analyticsService.generateWeeklyDigest() instead
   */
  getWeeklyDigest(): WeeklyDigest {
    if (process.env.NODE_ENV === 'development') {
    }
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)
    
    const weekStartStr = weekStart.toISOString().split("T")[0]
    const weekEndStr = today.toISOString().split("T")[0]
    
    const weekReflections = reflectionService.getReflectionsByDateRange(weekStartStr, weekEndStr)
    
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
    const averageWordCount = weekReflections.length > 0 ? Math.round(totalWords / weekReflections.length) : 0

    // Get reflection summaries
    const reflectionSummaries = weekReflections.slice(0, 7).map(r => ({
      date: r.date,
      prompt: r.prompt_text,
      snippet: r.reflection_text.slice(0, 100) + (r.reflection_text.length > 100 ? "..." : ""),
    }))
    
    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      totalReflections: weekReflections.length,
      topTags,
      moodDistribution,
      averageWordCount,
      currentStreak: this.getCurrentStreak(),
      reflectionSummaries,
    }
  },

  /**
   * Get daily activity for calendar
   * @deprecated Use analyticsService.getDailyActivity() instead
   */
  getDailyActivity(days: number = 90): DailyActivity[] {
    if (process.env.NODE_ENV === 'development') {
    }
    const today = new Date()
    const activities: DailyActivity[] = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      
      const dayReflections = reflectionService.getAllReflections().filter(r => r.date === dateStr)
      const moods = dayReflections.map(r => r.mood)
      
      activities.push({
        date: dateStr,
        count: dayReflections.length,
        moods,
      })
    }
    
    return activities.reverse() // Oldest first
  },

  /**
   * Get most used tags
   * @deprecated Use analyticsService.getMostUsedTags() instead
   */
  getMostUsedTags(limit: number = 10): { tag: string; count: number }[] {
    if (process.env.NODE_ENV === 'development') {
    }
    const reflections = reflectionService.getAllReflections()
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
