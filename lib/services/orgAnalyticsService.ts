import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const K_ANONYMITY_FLOOR = 5

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

  // 2. Get all active members of the org
  const { data: orgMembers, error: membersError } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', params.organizationId)
    .eq('status', 'active')

  if (membersError) {
    logger.error('org_analytics_members_fetch_error', { error: membersError })
    throw membersError
  }

  // 3. Filter to consented members only
  const activeConsentedMembers = (orgMembers || []).filter(
    m => consentedUserIds.has(m.user_id)
  )

  if (activeConsentedMembers.length < K_ANONYMITY_FLOOR) return null

  // 4. Count reflections for that day among consented members
  const userIds = activeConsentedMembers.map(m => m.user_id)
  const { data: reflections, error: reflectionsError } = await supabase
    .from('reflections')
    .select('mood')
    .in('user_id', userIds)
    .eq('created_at', `${params.date}T00:00:00`)
    .gte('created_at', `${params.date}T00:00:00`)
    .lt('created_at', `${params.date}T23:59:59`)

  if (reflectionsError) {
    logger.error('org_analytics_reflections_fetch_error', { error: reflectionsError })
    throw reflectionsError
  }

  const reflectionsCount = (reflections || []).length

  // 5. Calculate average mood score
  let avgMoodScore: number | null = null
  if (reflectionsCount > 0) {
    const moodScores = (reflections || [])
      .map(r => parseInt(r.mood, 10))
      .filter(score => !isNaN(score))

    if (moodScores.length > 0) {
      avgMoodScore = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
    }
  }

  return {
    organizationId: params.organizationId,
    date: params.date,
    activeMemberCount: activeConsentedMembers.length,
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
