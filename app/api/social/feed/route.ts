import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    const { data: acceptedFriends, error: friendError } = await supabase
      .from('friends')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (friendError) throw friendError

    const friendIds = new Set<string>()
    acceptedFriends?.forEach(f => {
      if (f.requester_id !== user.id) friendIds.add(f.requester_id)
      if (f.addressee_id !== user.id) friendIds.add(f.addressee_id)
    })
    friendIds.add(user.id)

    const friendIdArray = Array.from(friendIds)

    const { data: reflections, error: reflectionsError, count } = await supabase
      .from('reflections')
      .select(`
        id, prompt_text, reflection_text, mood, tags, word_count,
        visibility, created_at, allow_comments, user_id,
        profiles!inner(id, full_name, display_name, username, avatar_url)
      `, { count: 'exact' })
      .in('user_id', friendIdArray)
      .neq('visibility', 'private')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reflectionsError) throw reflectionsError

    const reflectionIds = (reflections || []).map(r => r.id)
    let commentCounts: Record<string, number> = {}
    let likeCounts: Record<string, number> = {}
    let userLikedSet = new Set<string>()

    if (reflectionIds.length > 0) {
      const [{ data: counts }] = await Promise.all([
        supabase.from('comments').select('reflection_id').in('reflection_id', reflectionIds),
      ])
      ;(counts as any[])?.forEach((c: any) => { commentCounts[c.reflection_id] = (commentCounts[c.reflection_id] || 0) + 1 })

      let likes: { reflection_id: string; user_id: string }[] | null = null
      try {
        const { data } = await supabase.from('reflection_likes').select('reflection_id, user_id').in('reflection_id', reflectionIds)
        likes = data as any
      } catch {}
      likes?.forEach((l: any) => {
        likeCounts[l.reflection_id] = (likeCounts[l.reflection_id] || 0) + 1
        if (l.user_id === user.id) userLikedSet.add(l.reflection_id)
      })
    }

    const feed = (reflections || []).map(r => ({
      reflection: {
        id: r.id,
        prompt_text: r.prompt_text,
        reflection_text: r.reflection_text,
        mood: r.mood,
        tags: r.tags,
        word_count: r.word_count,
        visibility: r.visibility,
        created_at: r.created_at,
        allow_comments: r.allow_comments,
      },
      author: r.profiles,
      comment_count: commentCounts[r.id] || 0,
      like_count: likeCounts[r.id] || 0,
      is_liked_by_me: userLikedSet.has(r.id),
    }))

    return NextResponse.json({
      success: true,
      data: feed,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}
