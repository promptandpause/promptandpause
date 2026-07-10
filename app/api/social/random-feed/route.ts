import { NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

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

    // RLS handles visibility filtering automatically:
    //   - public  → any authenticated user can view
    //   - friends_only → only accepted friends can view
    //   - private → only the owner
    // We exclude private explicitly and rely on RLS for the rest.
    const { data, error } = await supabase
      .from('reflections')
      .select(`
        id, prompt_text, reflection_text, mood, tags, word_count, visibility, allow_comments, created_at,
        user_id,
        profile:profiles!inner(id, full_name, display_name, username, avatar_url)
      `)
      .neq('visibility', 'private')
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Defensive in-memory filter (RLS should already handle it)
    const visible = (data || []).filter(r =>
      r.visibility === 'public' ||
      (r.visibility === 'friends_only' && friendIdSet.has(r.user_id))
    )

    const enriched = visible.map(r => ({
      ...r,
      is_from_friend: friendIdSet.has(r.user_id),
      reflection_text: r.reflection_text?.slice(0, 300),
      like_count: 0,
      is_liked_by_me: false,
    }))

    // Enrich with like counts
    const ids = enriched.map(r => r.id)
    if (ids.length > 0) {
      let likes: { reflection_id: string; user_id: string }[] = []
      try {
        const { data } = await supabase
          .from('reflection_likes')
          .select('reflection_id, user_id')
          .in('reflection_id', ids)
        likes = (data || []) as any
      } catch {}

      const userLikedSet = new Set(
        likes.filter(l => l.user_id === user.id).map(l => l.reflection_id)
      )
      const countMap: Record<string, number> = {}
      likes.forEach(l => { countMap[l.reflection_id] = (countMap[l.reflection_id] || 0) + 1 })
      ids.forEach(id => {
        const e = enriched.find(e => e.id === id)
        if (e) {
          e.like_count = countMap[id] || 0
          e.is_liked_by_me = userLikedSet.has(id)
        }
      })
    }

    return NextResponse.json({ success: true, data: enriched })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}
