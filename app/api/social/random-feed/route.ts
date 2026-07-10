import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    const { data: friendIds } = await supabase
      .from('friends')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const friendIdSet = new Set<string>()
    friendIds?.forEach(f => {
      if (f.requester_id !== user.id) friendIdSet.add(f.requester_id)
      if (f.addressee_id !== user.id) friendIdSet.add(f.addressee_id)
    })

    const { data, error } = await supabase
      .from('reflections')
      .select(`
        id, prompt_text, reflection_text, mood, tags, word_count, visibility, allow_comments, created_at,
        user_id,
        profile:profiles!reflections_user_id_fkey(id, full_name, display_name, username, avatar_url)
      `)
      .neq('user_id', user.id)
      .neq('visibility', 'private')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const reflectionIds = (data || []).map(r => r.id)
    let likeCounts: Record<string, { count: number; is_liked_by_me: boolean }> = {}

    if (reflectionIds.length > 0) {
      const { data: likes } = await supabase
        .from('reflection_likes')
        .select('reflection_id, user_id')

      const userLikedSet = new Set(
        likes?.filter(l => l.user_id === user.id).map(l => l.reflection_id) || []
      )

      const countMap: Record<string, number> = {}
      likes?.forEach(l => {
        countMap[l.reflection_id] = (countMap[l.reflection_id] || 0) + 1
      })

      reflectionIds.forEach(id => {
        likeCounts[id] = {
          count: countMap[id] || 0,
          is_liked_by_me: userLikedSet.has(id),
        }
      })
    }

    const enriched = (data || []).map(r => ({
      ...r,
      is_from_friend: friendIdSet.has(r.user_id),
      reflection_text: r.reflection_text?.slice(0, 300),
      like_count: likeCounts[r.id]?.count || 0,
      is_liked_by_me: likeCounts[r.id]?.is_liked_by_me || false,
    }))

    return NextResponse.json({ success: true, data: enriched })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}
