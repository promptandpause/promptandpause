import { SupabaseClient } from '@supabase/supabase-js'

export interface BreathingTechnique {
  id: string
  name: string
  description: string
  inhale: number // seconds
  hold1: number // seconds (after inhale)
  exhale: number // seconds
  hold2: number // seconds (after exhale)
  cycles: number // recommended cycles
  duration: number // total seconds
  category: 'calm' | 'energize' | 'focus' | 'sleep'
  isPremium: boolean
}

export interface BreathingSession {
  id: string
  user_id: string
  technique: string
  duration_seconds: number
  completed: boolean
  mood_before?: number
  mood_after?: number
  created_at: string
}

// Available breathing techniques
export const breathingTechniques: BreathingTechnique[] = [
  // FREE TECHNIQUES
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal parts inhale, hold, exhale, hold. Used by Navy SEALs for calm under pressure.',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
    duration: 64,
    category: 'calm',
    isPremium: false
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'Relaxing breath technique. Inhale 4, hold 7, exhale 8. Great for sleep and anxiety.',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
    duration: 76,
    category: 'sleep',
    isPremium: false
  },
  {
    id: 'calm',
    name: 'Calming Breath',
    description: 'Simple slow breathing to activate your parasympathetic nervous system.',
    inhale: 4,
    hold1: 2,
    exhale: 6,
    hold2: 0,
    cycles: 6,
    duration: 72,
    category: 'calm',
    isPremium: false
  },
  // PREMIUM TECHNIQUES
  {
    id: 'energize',
    name: 'Energizing Breath',
    description: 'Quick, powerful breaths to boost energy and alertness.',
    inhale: 2,
    hold1: 0,
    exhale: 2,
    hold2: 0,
    cycles: 30,
    duration: 120,
    category: 'energize',
    isPremium: true
  },
  {
    id: 'focus',
    name: 'Focus Breath',
    description: 'Balanced breathing to enhance concentration and mental clarity.',
    inhale: 5,
    hold1: 5,
    exhale: 5,
    hold2: 0,
    cycles: 6,
    duration: 90,
    category: 'focus',
    isPremium: true
  },
  {
    id: 'resonance',
    name: 'Resonance Breathing',
    description: '5.5 breaths per minute for optimal heart rate variability.',
    inhale: 5.5,
    hold1: 0,
    exhale: 5.5,
    hold2: 0,
    cycles: 10,
    duration: 110,
    category: 'calm',
    isPremium: true
  },
  {
    id: 'sleep',
    name: 'Sleep Preparation',
    description: 'Extended exhales to prepare your body for restful sleep.',
    inhale: 4,
    hold1: 4,
    exhale: 8,
    hold2: 2,
    cycles: 5,
    duration: 90,
    category: 'sleep',
    isPremium: true
  },
  {
    id: 'anxiety',
    name: 'Anxiety Relief',
    description: 'Longer exhales activate calm. Perfect for moments of overwhelm.',
    inhale: 3,
    hold1: 3,
    exhale: 6,
    hold2: 3,
    cycles: 5,
    duration: 75,
    category: 'calm',
    isPremium: true
  }
]

/**
 * Get available breathing techniques based on user tier
 */
export function getAvailableTechniques(isPremium: boolean): BreathingTechnique[] {
  if (isPremium) {
    return breathingTechniques
  }
  return breathingTechniques.filter(t => !t.isPremium)
}

/**
 * Get a specific breathing technique by ID
 */
export function getTechnique(id: string): BreathingTechnique | undefined {
  return breathingTechniques.find(t => t.id === id)
}

/**
 * Log a breathing session
 */
export async function logBreathingSession(
  supabase: SupabaseClient,
  userId: string,
  technique: string,
  durationSeconds: number,
  completed: boolean,
  moodBefore?: number,
  moodAfter?: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('breathing_sessions')
    .insert({
      user_id: userId,
      technique,
      duration_seconds: durationSeconds,
      completed,
      mood_before: moodBefore,
      mood_after: moodAfter
    })

  if (error) {
    console.error('Error logging breathing session:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get breathing session history
 */
export async function getBreathingHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<BreathingSession[]> {
  const { data, error } = await supabase
    .from('breathing_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching breathing history:', error)
    return []
  }

  return data || []
}

/**
 * Get breathing stats for a user
 */
export async function getBreathingStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalSessions: number
  totalMinutes: number
  averageMoodImprovement: number | null
  favoriteTechnique: string | null
}> {
  const { data, error } = await supabase
    .from('breathing_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)

  if (error || !data || data.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      averageMoodImprovement: null,
      favoriteTechnique: null
    }
  }

  const totalSessions = data.length
  const totalMinutes = Math.round(
    data.reduce((sum, s) => sum + s.duration_seconds, 0) / 60
  )

  // Calculate average mood improvement
  const sessionsWithMood = data.filter(s => s.mood_before && s.mood_after)
  const averageMoodImprovement = sessionsWithMood.length > 0
    ? sessionsWithMood.reduce((sum, s) => sum + (s.mood_after - s.mood_before), 0) / sessionsWithMood.length
    : null

  // Find favorite technique
  const techniqueCounts: Record<string, number> = {}
  for (const s of data) {
    techniqueCounts[s.technique] = (techniqueCounts[s.technique] || 0) + 1
  }
  
  const favoriteTechnique = Object.entries(techniqueCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return {
    totalSessions,
    totalMinutes,
    averageMoodImprovement: averageMoodImprovement ? Math.round(averageMoodImprovement * 10) / 10 : null,
    favoriteTechnique
  }
}
