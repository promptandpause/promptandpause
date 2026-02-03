import { SupabaseClient } from '@supabase/supabase-js'

export type GoalCategory = 'personal' | 'professional' | 'wellness' | 'relationships' | 'financial' | 'other'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  category: GoalCategory
  target_date?: string
  status: GoalStatus
  progress: number
  why_important?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface WeeklyIntention {
  id: string
  user_id: string
  week_start: string
  intentions: { text: string; completed: boolean }[]
  reflection?: string
  created_at: string
  updated_at: string
}

/**
 * Create a new goal
 */
export async function createGoal(
  supabase: SupabaseClient,
  userId: string,
  goal: {
    title: string
    description?: string
    category: GoalCategory
    target_date?: string
    why_important?: string
  }
): Promise<{ success: boolean; data?: Goal; error?: string }> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      ...goal,
      status: 'active',
      progress: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating goal:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get all goals for a user
 */
export async function getGoals(
  supabase: SupabaseClient,
  userId: string,
  status?: GoalStatus
): Promise<Goal[]> {
  let query = supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching goals:', error)
    return []
  }

  return data || []
}

/**
 * Get active goals (limit 3 for display)
 */
export async function getActiveGoals(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 3
): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching active goals:', error)
    return []
  }

  return data || []
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  supabase: SupabaseClient,
  goalId: string,
  progress: number
): Promise<{ success: boolean; error?: string }> {
  const updates: any = {
    progress: Math.min(100, Math.max(0, progress)),
    updated_at: new Date().toISOString()
  }

  // Auto-complete if progress reaches 100
  if (progress >= 100) {
    updates.status = 'completed'
    updates.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)

  if (error) {
    console.error('Error updating goal progress:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update goal status
 */
export async function updateGoalStatus(
  supabase: SupabaseClient,
  goalId: string,
  status: GoalStatus
): Promise<{ success: boolean; error?: string }> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
    updates.progress = 100
  }

  const { error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)

  if (error) {
    console.error('Error updating goal status:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete a goal
 */
export async function deleteGoal(
  supabase: SupabaseClient,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)

  if (error) {
    console.error('Error deleting goal:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get goal statistics
 */
export async function getGoalStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalGoals: number
  activeGoals: number
  completedGoals: number
  completionRate: number
}> {
  const { data, error } = await supabase
    .from('goals')
    .select('status')
    .eq('user_id', userId)

  if (error || !data) {
    return {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      completionRate: 0
    }
  }

  const totalGoals = data.length
  const activeGoals = data.filter(g => g.status === 'active').length
  const completedGoals = data.filter(g => g.status === 'completed').length
  const completionRate = totalGoals > 0 
    ? Math.round((completedGoals / totalGoals) * 100) 
    : 0

  return {
    totalGoals,
    activeGoals,
    completedGoals,
    completionRate
  }
}

// ============================================================================
// WEEKLY INTENTIONS
// ============================================================================

/**
 * Get the Monday of the current week
 */
function getWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

/**
 * Get this week's intentions
 */
export async function getWeeklyIntentions(
  supabase: SupabaseClient,
  userId: string
): Promise<WeeklyIntention | null> {
  const weekStart = getWeekStart()

  const { data, error } = await supabase
    .from('weekly_intentions')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching weekly intentions:', error)
  }

  return data
}

/**
 * Save weekly intentions
 */
export async function saveWeeklyIntentions(
  supabase: SupabaseClient,
  userId: string,
  intentions: { text: string; completed: boolean }[],
  reflection?: string
): Promise<{ success: boolean; error?: string }> {
  const weekStart = getWeekStart()

  const { error } = await supabase
    .from('weekly_intentions')
    .upsert({
      user_id: userId,
      week_start: weekStart,
      intentions,
      reflection,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,week_start'
    })

  if (error) {
    console.error('Error saving weekly intentions:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Toggle intention completion
 */
export async function toggleIntentionComplete(
  supabase: SupabaseClient,
  userId: string,
  intentionIndex: number
): Promise<{ success: boolean; error?: string }> {
  const current = await getWeeklyIntentions(supabase, userId)
  
  if (!current || !current.intentions[intentionIndex]) {
    return { success: false, error: 'Intention not found' }
  }

  const updatedIntentions = [...current.intentions]
  updatedIntentions[intentionIndex].completed = !updatedIntentions[intentionIndex].completed

  return saveWeeklyIntentions(supabase, userId, updatedIntentions, current.reflection)
}
