import { SupabaseClient } from '@supabase/supabase-js'

export type HabitCategory = 'wellness' | 'productivity' | 'social' | 'health' | 'mindfulness' | 'other'

export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  category: HabitCategory
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  log_date: string
  completed: boolean
  value?: number
  notes?: string
  created_at: string
}

export interface HabitWithLogs extends Habit {
  logs: HabitLog[]
  streak: number
  completionRate: number
}

// Default habits to suggest to new users
export const suggestedHabits = [
  { name: 'Sleep 7+ hours', icon: '😴', category: 'health' as HabitCategory },
  { name: 'Exercise', icon: '🏃', category: 'health' as HabitCategory },
  { name: 'Drink water', icon: '💧', category: 'health' as HabitCategory },
  { name: 'Meditate', icon: '🧘', category: 'mindfulness' as HabitCategory },
  { name: 'Read', icon: '📚', category: 'productivity' as HabitCategory },
  { name: 'No social media', icon: '📵', category: 'wellness' as HabitCategory },
  { name: 'Connect with someone', icon: '💬', category: 'social' as HabitCategory },
  { name: 'Go outside', icon: '🌳', category: 'wellness' as HabitCategory },
  { name: 'Gratitude practice', icon: '🙏', category: 'mindfulness' as HabitCategory },
  { name: 'Healthy eating', icon: '🥗', category: 'health' as HabitCategory },
]

/**
 * Create a new habit
 */
export async function createHabit(
  supabase: SupabaseClient,
  userId: string,
  habit: {
    name: string
    icon?: string
    category?: HabitCategory
  }
): Promise<{ success: boolean; data?: Habit; error?: string }> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: habit.name,
      icon: habit.icon || '✓',
      category: habit.category || 'wellness',
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating habit:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get all habits for a user
 */
export async function getHabits(
  supabase: SupabaseClient,
  userId: string,
  activeOnly: boolean = true
): Promise<Habit[]> {
  let query = supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching habits:', error)
    return []
  }

  return data || []
}

/**
 * Get habits with their logs for a date range
 */
export async function getHabitsWithLogs(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<HabitWithLogs[]> {
  // Get habits
  const habits = await getHabits(supabase, userId)
  
  if (habits.length === 0) return []

  // Get logs for date range
  const { data: logs, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)

  if (error) {
    console.error('Error fetching habit logs:', error)
  }

  // Calculate days in range
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Combine habits with their logs
  return habits.map(habit => {
    const habitLogs = (logs || []).filter(l => l.habit_id === habit.id)
    const completedLogs = habitLogs.filter(l => l.completed)
    
    return {
      ...habit,
      logs: habitLogs,
      streak: calculateHabitStreak(habitLogs),
      completionRate: daysInRange > 0 
        ? Math.round((completedLogs.length / daysInRange) * 100)
        : 0
    }
  })
}

/**
 * Calculate streak for a habit
 */
function calculateHabitStreak(logs: HabitLog[]): number {
  if (logs.length === 0) return 0

  // Sort by date descending
  const sortedLogs = [...logs]
    .filter(l => l.completed)
    .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())

  if (sortedLogs.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].log_date)
    logDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    if (logDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * Log a habit for today
 */
export async function logHabit(
  supabase: SupabaseClient,
  userId: string,
  habitId: string,
  completed: boolean,
  value?: number,
  notes?: string,
  date?: string
): Promise<{ success: boolean; error?: string }> {
  const logDate = date || new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('habit_logs')
    .upsert({
      user_id: userId,
      habit_id: habitId,
      log_date: logDate,
      completed,
      value,
      notes
    }, {
      onConflict: 'habit_id,log_date'
    })

  if (error) {
    console.error('Error logging habit:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get today's habit logs
 */
export async function getTodayHabitLogs(
  supabase: SupabaseClient,
  userId: string
): Promise<HabitLog[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', today)

  if (error) {
    console.error('Error fetching today habit logs:', error)
    return []
  }

  return data || []
}

/**
 * Update habit
 */
export async function updateHabit(
  supabase: SupabaseClient,
  habitId: string,
  updates: Partial<Pick<Habit, 'name' | 'icon' | 'category' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('habits')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', habitId)

  if (error) {
    console.error('Error updating habit:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete habit (soft delete by setting is_active to false)
 */
export async function deleteHabit(
  supabase: SupabaseClient,
  habitId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', habitId)

  if (error) {
    console.error('Error deleting habit:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get habit-mood correlation data
 */
export async function getHabitMoodCorrelation(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<{
  habit: string
  correlation: number
  completedDays: number
  avgMoodWithHabit: number
  avgMoodWithoutHabit: number
}[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Get habits
  const habits = await getHabits(supabase, userId)
  if (habits.length === 0) return []

  // Get habit logs
  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', startDateStr)

  // Get reflections with mood
  const { data: reflections } = await supabase
    .from('reflections')
    .select('created_at, mood')
    .eq('user_id', userId)
    .gte('created_at', startDateStr)
    .not('mood', 'is', null)

  if (!habitLogs || !reflections || reflections.length === 0) return []

  // Create mood map by date
  const moodByDate: Record<string, number[]> = {}
  for (const r of reflections) {
    const date = r.created_at.split('T')[0]
    if (!moodByDate[date]) moodByDate[date] = []
    moodByDate[date].push(r.mood)
  }

  // Calculate correlation for each habit
  const correlations = habits.map(habit => {
    const habitLogsByDate = new Set(
      (habitLogs || [])
        .filter(l => l.habit_id === habit.id && l.completed)
        .map(l => l.log_date)
    )

    const moodsWithHabit: number[] = []
    const moodsWithoutHabit: number[] = []

    for (const [date, moods] of Object.entries(moodByDate)) {
      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length
      if (habitLogsByDate.has(date)) {
        moodsWithHabit.push(avgMood)
      } else {
        moodsWithoutHabit.push(avgMood)
      }
    }

    const avgMoodWithHabit = moodsWithHabit.length > 0
      ? moodsWithHabit.reduce((a, b) => a + b, 0) / moodsWithHabit.length
      : 0
    const avgMoodWithoutHabit = moodsWithoutHabit.length > 0
      ? moodsWithoutHabit.reduce((a, b) => a + b, 0) / moodsWithoutHabit.length
      : 0

    // Simple correlation: difference in average mood
    const correlation = avgMoodWithHabit - avgMoodWithoutHabit

    return {
      habit: habit.name,
      correlation: Math.round(correlation * 10) / 10,
      completedDays: habitLogsByDate.size,
      avgMoodWithHabit: Math.round(avgMoodWithHabit * 10) / 10,
      avgMoodWithoutHabit: Math.round(avgMoodWithoutHabit * 10) / 10
    }
  })

  // Sort by absolute correlation
  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}
