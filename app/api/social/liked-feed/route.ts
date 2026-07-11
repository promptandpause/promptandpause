import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { decryptIfEncrypted } from '@/lib/utils/crypto'

// GET /api/social/liked-feed?user_id=<uuid>
// Returns reflections liked by `user_id` (defaults to the current viewer),
// most recently liked first.
// Uses the RLS-scoped client so a reflection whose visibility changed since
// the like (e.g. author made it private again) will naturally drop out --
// this also means viewing someone else's Likes tab only shows reflections
// YOU are currently allowed to see, regardless of what they liked.
export async function GET(request: NextRequest) {
  try {
    const viewer = await getAuthUser()
    if (!viewer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('user_id') || viewer.id

    const supabase = await createClient()

    // 1. Which reflections has the target user liked, most recent first
    const { data: likes, error: likesError } = await supabase
      .from('reflection_likes')
      .select('reflection_id, created_at')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (likesError) throw likesError
    if (!likes || likes.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const likedOrder = likes.map(l => l.reflection_id)

    // 2. Fetch those reflections. RLS enforces visibility automatically.
    const { data: reflections, error: reflectionsError } = await supabase
      .from('reflections')
      .select(`
        id, prompt_text, reflection_text, mood, tags, word_count, visibility, allow_comments, created_at,
        user_id
      `)
      .in('id', likedOrder)

    if (reflectionsError) throw reflectionsError

    // 3. Friend set, for the "from a friend" badge
    const { data: friendRows } = await supabase
      .from('friends')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${viewer.id},addressee_id.eq.${viewer.id}`)
      .eq('status', 'accepted')

    const friendIdSet = new Set<string>()
    friendRows?.forEach(f => {
      if (f.requester_id !== viewer.id) friendIdSet.add(f.requester_id)
      if (f.addressee_id !== viewer.id) friendIdSet.add(f.addressee_id)
    })

    // 4. Profiles fetched separately (reflections.user_id -> public.users, not profiles directly)
    const authorIds = [...new Set((reflections || []).map(r => r.user_id))]
    const profileMap = new Map<string, any>()
    if (authorIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url')
        .in('id', authorIds)

      if (profilesError) throw profilesError
      profiles?.forEach(p => profileMap.set(p.id, p))
    }

    // 5. Like counts + comment counts for each reflection, and whether the
    // current viewer (not necessarily the profile whose likes we're showing)
    // has liked each one
    const reflectionIds = (reflections || []).map(r => r.id)
    const countMap: Record<string, number> = {}
    const commentCountMap: Record<string, number> = {}
    const viewerLikedSet = new Set<string>()
    if (reflectionIds.length > 0) {
      const [{ data: allLikes }, { data: viewerLikes }, { data: allComments }] = await Promise.all([
        supabase.from('reflection_likes').select('reflection_id').in('reflection_id', reflectionIds),
        supabase.from('reflection_likes').select('reflection_id').eq('user_id', viewer.id).in('reflection_id', reflectionIds),
        supabase.from('comments').select('reflection_id').in('reflection_id', reflectionIds),
      ])
      allLikes?.forEach((l: any) => {
        countMap[l.reflection_id] = (countMap[l.reflection_id] || 0) + 1
      })
      viewerLikes?.forEach((l: any) => viewerLikedSet.add(l.reflection_id))
      allComments?.forEach((c: any) => {
        commentCountMap[c.reflection_id] = (commentCountMap[c.reflection_id] || 0) + 1
      })
    }

    // 6. Build response, preserving "most recently liked" order
    const byId = new Map((reflections || []).map(r => [r.id, r]))
    const enriched = likedOrder
      .map(id => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map(r => ({
        ...r,
        profile: profileMap.get(r.user_id) || null,
        is_from_friend: friendIdSet.has(r.user_id),
        reflection_text: (decryptIfEncrypted(r.reflection_text) || r.reflection_text)?.slice(0, 300),
        like_count: countMap[r.id] || 0,
        comment_count: commentCountMap[r.id] || 0,
        is_liked_by_me: viewerLikedSet.has(r.id),
      }))

    return NextResponse.json({ success: true, data: enriched })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch liked reflections' },
      { status: 500 }
    )
  }
}
