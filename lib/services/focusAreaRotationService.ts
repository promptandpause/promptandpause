/**
 * Focus Area Rotation Service
 * 
 * Implements deterministic rotation logic for daily prompts based on user's
 * selected focus areas from onboarding. Ensures variety and intentional
 * progression through focus areas rather than random selection.
 * 
 * Key Features:
 * - Weekly cadence for users with all 6 focus areas
 * - LRU (Least Recently Used) rotation for users with subset
 * - No consecutive same-focus days
 * - Sunday special handling (synthesis or gentle prompt)
 * - Feedback decay for adaptive selection
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { FREEMIUM_FOCUS_AREAS } from '@/lib/constants/focusAreas'

/**
 * The 6 core focus areas in canonical order (for weekly cadence)
 */
export const FOCUS_AREA_WEEKLY_CADENCE: Record<number, string> = {
  1: 'Clarity',           // Monday
  2: 'Emotional Balance', // Tuesday
  3: 'Work & Responsibility', // Wednesday
  4: 'Relationships',     // Thursday
  5: 'Change & Uncertainty', // Friday
  6: 'Grounding',         // Saturday
  // Sunday (0) is handled specially
}

/**
 * Sunday focus options - gentler themes for reflection/synthesis
 */
export const SUNDAY_FOCUS_OPTIONS = ['Emotional Balance', 'Relationships', 'Grounding']

/**
 * All valid focus area names
 */
export const ALL_FOCUS_AREA_NAMES = FREEMIUM_FOCUS_AREAS.map(f => f.name)

export interface FocusAreaRotationContext {
  userId: string
  userFocusAreas: string[]  // User's selected focus areas from onboarding
  recentFocusAreas?: string[] // Focus areas used in recent prompts (most recent first)
  recentFeedback?: Array<{ focusArea: string; feedback: 'helped' | 'irrelevant'; daysAgo: number }>
  dayOfWeek?: number // 0 = Sunday, 1 = Monday, ... 6 = Saturday
}

export interface FocusAreaRotationResult {
  selectedFocus: string
  rotationType: 'weekly_cadence' | 'lru_rotation' | 'sunday_special' | 'fallback'
  reason: string
}

/**
 * Select the focus area for today's prompt using deterministic rotation
 * 
 * Rules:
 * 1. Only select from user's chosen focus areas (from onboarding)
 * 2. Never repeat same focus on consecutive days
 * 3. For users with all 6 focuses: follow weekly cadence
 * 4. For users with subset: use LRU rotation
 * 5. Sunday: synthesis/gentle prompt (Emotional Balance, Relationships, or Grounding)
 */
export async function selectFocusAreaWithRotation(
  context: FocusAreaRotationContext
): Promise<FocusAreaRotationResult> {
  const { userId, userFocusAreas, dayOfWeek } = context
  
  // Validate user has focus areas
  if (!userFocusAreas || userFocusAreas.length === 0) {
    return {
      selectedFocus: 'Grounding',
      rotationType: 'fallback',
      reason: 'No focus areas selected - using default Grounding'
    }
  }

  // Normalize focus area names (case-insensitive matching)
  const normalizedUserFocuses = userFocusAreas.map(f => 
    ALL_FOCUS_AREA_NAMES.find(n => n.toLowerCase() === f.toLowerCase()) || f
  )

  // EDGE CASE: Single focus area selected
  // No rotation possible - this is expected behaviour, not a bug
  if (normalizedUserFocuses.length === 1) {
    return {
      selectedFocus: normalizedUserFocuses[0],
      rotationType: 'fallback',
      reason: 'single_focus_fallback - only one focus area selected, rotation not applicable'
    }
  }

  // Get recent focus areas from database if not provided
  let recentFocusAreas = context.recentFocusAreas
  if (!recentFocusAreas) {
    recentFocusAreas = await getRecentFocusAreasFromDB(userId)
  }

  // Get the day of week (0 = Sunday)
  const today = dayOfWeek ?? new Date().getDay()
  const lastUsedFocus = recentFocusAreas?.[0] || null

  // Check if user has all 6 focus areas
  const hasAllFocuses = ALL_FOCUS_AREA_NAMES.every(name =>
    normalizedUserFocuses.some(uf => uf.toLowerCase() === name.toLowerCase())
  )

  // SUNDAY SPECIAL: Use gentle/synthesis focus
  if (today === 0) {
    return selectSundayFocus(normalizedUserFocuses, lastUsedFocus, context.recentFeedback)
  }

  // ALL FOCUSES: Use weekly cadence
  if (hasAllFocuses) {
    return selectWeeklyCadenceFocus(today, lastUsedFocus, normalizedUserFocuses)
  }

  // SUBSET: Use LRU rotation
  return selectLRUFocus(normalizedUserFocuses, recentFocusAreas, context.recentFeedback)
}

/**
 * Select focus for Sunday - synthesis or gentle emotional prompt
 */
function selectSundayFocus(
  userFocusAreas: string[],
  lastUsedFocus: string | null,
  recentFeedback?: Array<{ focusArea: string; feedback: 'helped' | 'irrelevant'; daysAgo: number }>
): FocusAreaRotationResult {
  // Filter Sunday options to only those the user selected
  const availableSundayOptions = SUNDAY_FOCUS_OPTIONS.filter(opt =>
    userFocusAreas.some(uf => uf.toLowerCase() === opt.toLowerCase())
  )

  if (availableSundayOptions.length === 0) {
    // User doesn't have any Sunday options - use their first focus area
    const fallback = userFocusAreas[0]
    return {
      selectedFocus: fallback,
      rotationType: 'sunday_special',
      reason: `Sunday fallback - no gentle options available, using ${fallback}`
    }
  }

  // Avoid same focus as yesterday
  let candidates = availableSundayOptions.filter(opt => opt !== lastUsedFocus)
  if (candidates.length === 0) {
    candidates = availableSundayOptions
  }

  // Apply feedback weighting
  const weighted = applyFeedbackWeights(candidates, recentFeedback)
  
  // Pick the highest weighted option (or first if tied)
  const sorted = [...weighted].sort((a, b) => b.weight - a.weight)
  const selected = sorted[0]?.focus || candidates[0]

  return {
    selectedFocus: selected,
    rotationType: 'sunday_special',
    reason: `Sunday special - gentle focus on ${selected}`
  }
}

/**
 * Select focus using weekly cadence (for users with all 6 focuses)
 */
function selectWeeklyCadenceFocus(
  dayOfWeek: number,
  lastUsedFocus: string | null,
  userFocusAreas: string[]
): FocusAreaRotationResult {
  // Get the scheduled focus for today
  const scheduledFocus = FOCUS_AREA_WEEKLY_CADENCE[dayOfWeek]

  if (!scheduledFocus) {
    // Shouldn't happen (Sunday is handled separately), but fallback
    return {
      selectedFocus: userFocusAreas[0],
      rotationType: 'fallback',
      reason: 'Unknown day of week - using first focus area'
    }
  }

  // Check if scheduled focus is same as yesterday's
  if (scheduledFocus === lastUsedFocus) {
    // Find the next focus in rotation that isn't the same
    const dayOrder = [1, 2, 3, 4, 5, 6] // Mon-Sat
    const currentIdx = dayOrder.indexOf(dayOfWeek)
    const nextIdx = (currentIdx + 1) % dayOrder.length
    const alternateFocus = FOCUS_AREA_WEEKLY_CADENCE[dayOrder[nextIdx]]

    return {
      selectedFocus: alternateFocus,
      rotationType: 'weekly_cadence',
      reason: `Weekly cadence - shifted from ${scheduledFocus} (used yesterday) to ${alternateFocus}`
    }
  }

  return {
    selectedFocus: scheduledFocus,
    rotationType: 'weekly_cadence',
    reason: `Weekly cadence - scheduled focus for day ${dayOfWeek}`
  }
}

/**
 * Select focus using Least Recently Used (LRU) rotation
 * For users who selected a subset of focus areas
 */
function selectLRUFocus(
  userFocusAreas: string[],
  recentFocusAreas: string[],
  recentFeedback?: Array<{ focusArea: string; feedback: 'helped' | 'irrelevant'; daysAgo: number }>
): FocusAreaRotationResult {
  const lastUsedFocus = recentFocusAreas[0] || null

  // Build a map of how recently each focus was used
  const usageRecency: Map<string, number> = new Map()
  recentFocusAreas.forEach((focus, idx) => {
    if (!usageRecency.has(focus)) {
      usageRecency.set(focus, idx) // Lower index = more recent
    }
  })

  // Score each of the user's focus areas (higher = better to pick)
  const scored = userFocusAreas.map(focus => {
    let score = 100 // Base score

    // Penalty for recent usage (LRU logic)
    const recency = usageRecency.get(focus)
    if (recency !== undefined) {
      // More recent = lower score
      score -= (10 - Math.min(recency, 10)) * 10
    } else {
      // Never used = bonus
      score += 50
    }

    // Heavy penalty for being used yesterday (avoid consecutive)
    if (focus === lastUsedFocus) {
      score -= 200
    }

    return { focus, score }
  })

  // Apply feedback weights
  const withFeedback = applyFeedbackWeights(
    scored.map(s => s.focus),
    recentFeedback
  )

  // Combine scores
  const combined = scored.map(s => {
    const feedbackWeight = withFeedback.find(f => f.focus === s.focus)?.weight || 1
    return {
      focus: s.focus,
      score: s.score * feedbackWeight
    }
  })

  // Sort by score (highest first) and pick
  combined.sort((a, b) => b.score - a.score)
  
  const selected = combined[0]?.focus || userFocusAreas[0]

  return {
    selectedFocus: selected,
    rotationType: 'lru_rotation',
    reason: `LRU rotation - least recently used: ${selected}`
  }
}

/**
 * Apply feedback-based weighting with decay
 * Positive feedback within 14 days boosts weight
 * Negative feedback within 14 days reduces weight
 * Older feedback decays exponentially
 */
function applyFeedbackWeights(
  focusAreas: string[],
  recentFeedback?: Array<{ focusArea: string; feedback: 'helped' | 'irrelevant'; daysAgo: number }>
): Array<{ focus: string; weight: number }> {
  if (!recentFeedback || recentFeedback.length === 0) {
    return focusAreas.map(focus => ({ focus, weight: 1 }))
  }

  const DECAY_HALF_LIFE = 7 // Days until feedback weight halves
  const POSITIVE_BOOST = 0.3
  const NEGATIVE_PENALTY = 0.2

  return focusAreas.map(focus => {
    let weight = 1

    // Find relevant feedback for this focus
    const relevantFeedback = recentFeedback.filter(
      f => f.focusArea.toLowerCase() === focus.toLowerCase()
    )

    for (const fb of relevantFeedback) {
      // Exponential decay based on days ago
      const decayFactor = Math.pow(0.5, fb.daysAgo / DECAY_HALF_LIFE)

      if (fb.feedback === 'helped') {
        weight += POSITIVE_BOOST * decayFactor
      } else if (fb.feedback === 'irrelevant') {
        weight -= NEGATIVE_PENALTY * decayFactor
      }
    }

    // Clamp weight to reasonable range
    weight = Math.max(0.3, Math.min(2, weight))

    return { focus, weight }
  })
}

/**
 * Get recent focus areas from prompts_history database
 */
async function getRecentFocusAreasFromDB(userId: string): Promise<string[]> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('prompts_history')
      .select('focus_area_used, date_generated')
      .eq('user_id', userId)
      .not('focus_area_used', 'is', null)
      .order('date_generated', { ascending: false })
      .limit(14) // Last 2 weeks

    if (error || !data) {
      return []
    }

    return data
      .map(d => d.focus_area_used)
      .filter((f): f is string => typeof f === 'string' && f.length > 0)
  } catch {
    return []
  }
}

/**
 * Get recent feedback from reflections for focus area weighting
 */
export async function getRecentFeedbackFromDB(
  userId: string
): Promise<Array<{ focusArea: string; feedback: 'helped' | 'irrelevant'; daysAgo: number }>> {
  try {
    const supabase = createServiceRoleClient()
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('reflections')
      .select(`
        feedback,
        date,
        prompts_history!inner(focus_area_used)
      `)
      .eq('user_id', userId)
      .gte('date', fourteenDaysAgo)
      .not('feedback', 'is', null)
      .order('date', { ascending: false })

    if (error || !data) {
      return []
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return data
      .filter((r: any) => r.prompts_history?.focus_area_used && r.feedback)
      .map((r: any) => {
        const reflectionDate = new Date(r.date)
        reflectionDate.setHours(0, 0, 0, 0)
        const daysAgo = Math.floor((today.getTime() - reflectionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          focusArea: r.prompts_history.focus_area_used,
          feedback: r.feedback as 'helped' | 'irrelevant',
          daysAgo
        }
      })
  } catch {
    return []
  }
}

/**
 * Check for active premium focus override
 * Returns the override focus area if active, null otherwise
 */
async function getActiveFocusOverride(userId: string): Promise<{
  focusArea: string
  until: string | null
} | null> {
  try {
    const supabase = createServiceRoleClient()
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('focus_override_area, focus_override_until')
      .eq('user_id', userId)
      .single()

    if (error || !data?.focus_override_area) {
      return null
    }

    // Check if override has expired
    if (data.focus_override_until && data.focus_override_until < today) {
      // Override expired - clear it
      await supabase
        .from('user_preferences')
        .update({
          focus_override_area: null,
          focus_override_until: null,
          focus_override_set_at: null
        })
        .eq('user_id', userId)
      return null
    }

    return {
      focusArea: data.focus_override_area,
      until: data.focus_override_until
    }
  } catch {
    return null
  }
}

/**
 * Set focus override for premium user
 * @param userId - User ID
 * @param focusArea - Focus area to override to (or null to clear)
 * @param duration - 'today' | 'until_cleared'
 */
export async function setFocusOverride(
  userId: string,
  focusArea: string | null,
  duration: 'today' | 'until_cleared' = 'today'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()
    
    // Clear override
    if (!focusArea) {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          focus_override_area: null,
          focus_override_until: null,
          focus_override_set_at: null
        })
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    }

    // Validate focus area
    const normalizedFocus = ALL_FOCUS_AREA_NAMES.find(
      n => n.toLowerCase() === focusArea.toLowerCase()
    )
    if (!normalizedFocus) {
      return { success: false, error: `Invalid focus area: ${focusArea}` }
    }

    // Calculate expiry
    const until = duration === 'today' 
      ? new Date().toISOString().split('T')[0]
      : null

    const { error } = await supabase
      .from('user_preferences')
      .update({
        focus_override_area: normalizedFocus,
        focus_override_until: until,
        focus_override_set_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * Main entry point for focus area selection
 * Fetches all necessary context and returns the selected focus area
 */
export async function selectDailyFocusArea(
  userId: string,
  userFocusAreas: string[]
): Promise<FocusAreaRotationResult> {
  // Check for premium focus override first
  const override = await getActiveFocusOverride(userId)
  if (override) {
    return {
      selectedFocus: override.focusArea,
      rotationType: 'fallback',
      reason: `premium_manual_override - user set focus to ${override.focusArea}${override.until ? ` until ${override.until}` : ' (until cleared)'}`
    }
  }

  // Fetch recent data in parallel
  const [recentFocusAreas, recentFeedback] = await Promise.all([
    getRecentFocusAreasFromDB(userId),
    getRecentFeedbackFromDB(userId)
  ])

  return selectFocusAreaWithRotation({
    userId,
    userFocusAreas,
    recentFocusAreas,
    recentFeedback,
    dayOfWeek: new Date().getDay()
  })
}
