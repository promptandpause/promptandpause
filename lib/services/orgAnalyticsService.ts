import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const K_ANONYMITY_FLOOR = 5

// Mood is stored as an emoji (MoodType), so averaging requires the same
// score map the rest of the app uses for mood trends.
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
 * Aggregate engagement for a single org on a single date.
 * Returns null if below k-anonymity floor.
 */
export async function aggregateOrgDay(params: {
  organizationId: string
  date: string // YYYY-MM-DD
}): Promise<{
  organizationId: string
  date: string
  activeMemberCount: number
  reflectionsCount: number
  avgMoodScore: number | null
} | null> {
  const supabase = createServiceRoleClient()

  // 1. Get active members (those with consent)
  const { data: consentedMembers, error: consentError } = await supabase
    .from('organization_consent')
    .select('user_id')
    .eq('organization_id', params.organizationId)

  if (consentError) {
    logger.error('org_analytics_consent_fetch_error', { error: consentError })
    throw consentError
  }

  const consentedUserIds = new Set((consentedMembers || []).map(m => m.user_id))
  if (consentedUserIds.size === 0) return null

  // 2. Get all active members of the org, filter to consented members only
  const { data: orgMembers, error: membersError } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', params.organizationId)
    .eq('status', 'active')

  if (membersError) {
    logger.error('org_analytics_members_fetch_error', { error: membersError })
    throw membersError
  }

  const activeConsentedMembers = (orgMembers || []).filter(
    m => consentedUserIds.has(m.user_id)
  )
  if (activeConsentedMembers.length < K_ANONYMITY_FLOOR) return null

  // 3. Count reflections for that day among consented members
  const userIds = activeConsentedMembers.map(m => m.user_id)
  const dayStart = new Date(`${params.date}T00:00:00Z`)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const { data: reflections, error: reflectionsError } = await supabase
    .from('reflections')
    .select('user_id, mood')
    .in('user_id', userIds)
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', dayEnd.toISOString())

  if (reflectionsError) {
    logger.error('org_analytics_reflections_fetch_error', { error: reflectionsError })
    throw reflectionsError
  }

  const dayReflections = reflections || []
  const reflectionsCount = dayReflections.length

  // "Active" means someone actually wrote that day -- not merely that they're
  // a consented member. The k-anonymity floor applies to this count, so a
  // small day can never reveal "1 or 2 people engaged today".
  const activeWriterIds = new Set(dayReflections.map(r => r.user_id))
  const activeMemberCount = activeWriterIds.size
  if (activeMemberCount < K_ANONYMITY_FLOOR) return null

  // 4. Average mood score (emoji -> score), only when we have a real signal
  let avgMoodScore: number | null = null
  const moodScores = dayReflections
    .map(r => MOOD_SCORES[r.mood as string])
    .filter((score): score is number => typeof score === 'number')

  if (moodScores.length > 0) {
    avgMoodScore = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
  }

  return {
    organizationId: params.organizationId,
    date: params.date,
    activeMemberCount,
    reflectionsCount,
    avgMoodScore,
  }
}

export async function upsertOrgEngagementDay(params: {
  organizationId: string
  date: string
}): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const aggregated = await aggregateOrgDay(params)
  if (!aggregated) return false

  const { error } = await supabase
    .from('organization_engagement_daily')
    .upsert(
      {
        organization_id: params.organizationId,
        date: params.date,
        active_member_count: aggregated.activeMemberCount,
        reflections_count: aggregated.reflectionsCount,
        avg_mood_score: aggregated.avgMoodScore,
      },
      { onConflict: 'organization_id,date' }
    )

  if (error) {
    logger.error('org_analytics_upsert_error', { error })
    throw error
  }

  return true
}
