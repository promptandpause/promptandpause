import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'

export async function addCircleMember(params: {
  circleId: string
  ownerId: string
  friendId: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const { circleId, ownerId, friendId } = params

  const limited = await rateLimitOr429(`circle:add_member:${ownerId}`, {
    limit: 20,
    windowMs: 60_000,
  })
  if (limited) return { success: false, error: 'Too many requests. Slow down.' }

  const supabase = createServiceRoleClient()

  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .select('id, owner_id')
    .eq('id', circleId)
    .single()

  if (circleError || !circle) {
    return { success: false, error: 'Circle not found' }
  }

  if (circle.owner_id !== ownerId) {
    return { success: false, error: 'Not authorized' }
  }

  const { data: friendship, error: friendError } = await supabase
    .from('friends')
    .select('id, status')
    .or(`and(requester_id.eq.${ownerId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${ownerId})`)
    .eq('status', 'accepted')
    .maybeSingle()

  if (friendError) {
    logger.error('circle_add_member_friendship_check_error', { error: friendError })
    return { success: false, error: 'Failed to verify friendship' }
  }

  if (!friendship) {
    return { success: false, error: 'You can only add accepted friends to your circle' }
  }

  const { data, error } = await supabase
    .from('circle_members')
    .insert({ circle_id: circleId, friend_id: friendId })
    .select('circle_id, friend_id, added_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'This person is already in your circle' }
    }
    logger.error('circle_add_member_insert_error', { error })
    return { success: false, error: error.message || 'Failed to add member' }
  }

  return { success: true, data }
}

export async function removeCircleMember(params: {
  circleId: string
  ownerId: string
  friendId: string
}): Promise<{ success: boolean; error?: string }> {
  const { circleId, ownerId, friendId } = params

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('friend_id', friendId)

  if (error) {
    logger.error('circle_remove_member_error', { error })
    return { success: false, error: error.message || 'Failed to remove member' }
  }

  return { success: true }
}

export async function getCirclesForUser(userId: string) {
  const supabase = createServiceRoleClient()

  const { data: circles, error } = await supabase
    .from('circles')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const circleIds = (circles || []).map(c => c.id)
  let membersByCircle = new Map<string, any[]>()

  if (circleIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select('circle_id, friend_id, added_at')
      .in('circle_id', circleIds)

    if (membersError) throw membersError

    const friendIds = [...new Set((members || []).map(m => m.friend_id))]
    const profileMap = new Map<string, any>()
    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url')
        .in('id', friendIds)
      profiles?.forEach(p => profileMap.set(p.id, p))
    }

    members?.forEach(m => {
      const enrichedMember = { ...m, profile: profileMap.get(m.friend_id) || null }
      const list = membersByCircle.get(m.circle_id) || []
      list.push(enrichedMember)
      membersByCircle.set(m.circle_id, list)
    })
  }

  return (circles || []).map(c => ({
    ...c,
    members: membersByCircle.get(c.id) || [],
  }))
}
