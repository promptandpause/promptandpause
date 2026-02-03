import { SupabaseClient } from '@supabase/supabase-js'

export type RitualType = 'morning' | 'evening' | 'custom'

export interface RitualItem {
  name: string
  duration_minutes: number
  order: number
  completed?: boolean
}

export interface DailyRitual {
  id: string
  user_id: string
  name: string
  type: RitualType
  items: RitualItem[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RitualCompletion {
  id: string
  user_id: string
  ritual_id: string
  completion_date: string
  items_completed: string[]
  duration_minutes?: number
  notes?: string
  created_at: string
}

// Template rituals users can start with
export const ritualTemplates = {
  morning: {
    name: 'Morning Mindfulness',
    type: 'morning' as RitualType,
    items: [
      { name: 'Hydrate - drink a glass of water', duration_minutes: 1, order: 1 },
      { name: 'Stretch or light movement', duration_minutes: 5, order: 2 },
      { name: 'Breathing exercise', duration_minutes: 3, order: 3 },
      { name: 'Set 3 intentions for the day', duration_minutes: 2, order: 4 },
      { name: 'Gratitude - 3 things you\'re thankful for', duration_minutes: 2, order: 5 }
    ]
  },
  evening: {
    name: 'Evening Wind-Down',
    type: 'evening' as RitualType,
    items: [
      { name: 'Review the day - what went well?', duration_minutes: 3, order: 1 },
      { name: 'Gratitude reflection', duration_minutes: 2, order: 2 },
      { name: 'Plan tomorrow\'s top 3 priorities', duration_minutes: 3, order: 3 },
      { name: 'Relaxing breathing exercise', duration_minutes: 5, order: 4 },
      { name: 'Digital sunset - put devices away', duration_minutes: 1, order: 5 }
    ]
  },
  focus: {
    name: 'Focus Session Prep',
    type: 'custom' as RitualType,
    items: [
      { name: 'Clear workspace', duration_minutes: 2, order: 1 },
      { name: 'Set intention for the session', duration_minutes: 1, order: 2 },
      { name: 'Focus breathing', duration_minutes: 2, order: 3 },
      { name: 'Silence notifications', duration_minutes: 1, order: 4 }
    ]
  }
}

/**
 * Create a new ritual
 */
export async function createRitual(
  supabase: SupabaseClient,
  userId: string,
  ritual: {
    name: string
    type: RitualType
    items: RitualItem[]
  }
): Promise<{ success: boolean; data?: DailyRitual; error?: string }> {
  const { data, error } = await supabase
    .from('daily_rituals')
    .insert({
      user_id: userId,
      name: ritual.name,
      type: ritual.type,
      items: ritual.items,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ritual:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Create ritual from template
 */
export async function createRitualFromTemplate(
  supabase: SupabaseClient,
  userId: string,
  templateKey: keyof typeof ritualTemplates
): Promise<{ success: boolean; data?: DailyRitual; error?: string }> {
  const template = ritualTemplates[templateKey]
  return createRitual(supabase, userId, template)
}

/**
 * Get all rituals for a user
 */
export async function getRituals(
  supabase: SupabaseClient,
  userId: string,
  activeOnly: boolean = true
): Promise<DailyRitual[]> {
  let query = supabase
    .from('daily_rituals')
    .select('*')
    .eq('user_id', userId)
    .order('type', { ascending: true })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching rituals:', error)
    return []
  }

  return data || []
}

/**
 * Get ritual by type (morning/evening)
 */
export async function getRitualByType(
  supabase: SupabaseClient,
  userId: string,
  type: RitualType
): Promise<DailyRitual | null> {
  const { data, error } = await supabase
    .from('daily_rituals')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching ritual:', error)
  }

  return data
}

/**
 * Update ritual
 */
export async function updateRitual(
  supabase: SupabaseClient,
  ritualId: string,
  updates: Partial<Pick<DailyRitual, 'name' | 'items' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('daily_rituals')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', ritualId)

  if (error) {
    console.error('Error updating ritual:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete ritual
 */
export async function deleteRitual(
  supabase: SupabaseClient,
  ritualId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('daily_rituals')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', ritualId)

  if (error) {
    console.error('Error deleting ritual:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Log ritual completion
 */
export async function logRitualCompletion(
  supabase: SupabaseClient,
  userId: string,
  ritualId: string,
  itemsCompleted: string[],
  durationMinutes?: number,
  notes?: string,
  date?: string
): Promise<{ success: boolean; error?: string }> {
  const completionDate = date || new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('ritual_completions')
    .upsert({
      user_id: userId,
      ritual_id: ritualId,
      completion_date: completionDate,
      items_completed: itemsCompleted,
      duration_minutes: durationMinutes,
      notes
    }, {
      onConflict: 'ritual_id,completion_date'
    })

  if (error) {
    console.error('Error logging ritual completion:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get today's ritual completion
 */
export async function getTodayRitualCompletion(
  supabase: SupabaseClient,
  ritualId: string
): Promise<RitualCompletion | null> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('ritual_completions')
    .select('*')
    .eq('ritual_id', ritualId)
    .eq('completion_date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching ritual completion:', error)
  }

  return data
}

/**
 * Get ritual streak
 */
export async function getRitualStreak(
  supabase: SupabaseClient,
  ritualId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('ritual_completions')
    .select('completion_date')
    .eq('ritual_id', ritualId)
    .order('completion_date', { ascending: false })
    .limit(30)

  if (error || !data || data.length === 0) {
    return 0
  }

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < data.length; i++) {
    const completionDate = new Date(data[i].completion_date)
    completionDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * Get ritual statistics
 */
export async function getRitualStats(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<{
  totalCompletions: number
  longestStreak: number
  currentStreak: number
  completionRate: number
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: completions, error } = await supabase
    .from('ritual_completions')
    .select('completion_date, ritual_id')
    .eq('user_id', userId)
    .gte('completion_date', startDate.toISOString().split('T')[0])
    .order('completion_date', { ascending: false })

  if (error || !completions) {
    return {
      totalCompletions: 0,
      longestStreak: 0,
      currentStreak: 0,
      completionRate: 0
    }
  }

  // Get unique dates
  const uniqueDates = new Set(completions.map(c => c.completion_date))
  const totalCompletions = uniqueDates.size

  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sortedDates = Array.from(uniqueDates).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  for (let i = 0; i < sortedDates.length; i++) {
    const completionDate = new Date(sortedDates[i])
    completionDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    if (completionDate.getTime() === expectedDate.getTime()) {
      currentStreak++
    } else {
      break
    }
  }

  // Calculate longest streak (simplified - just use current for now)
  const longestStreak = Math.max(currentStreak, totalCompletions > 0 ? 1 : 0)

  // Completion rate
  const completionRate = days > 0 ? Math.round((totalCompletions / days) * 100) : 0

  return {
    totalCompletions,
    longestStreak,
    currentStreak,
    completionRate
  }
}
