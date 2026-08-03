import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase/server'
import { getOrgMembership } from '@/lib/services/orgService'
import { decryptIfEncrypted } from '@/lib/utils/crypto'

// GET /api/org/[id]/feed
// Team feed: reflections members chose to share with this workspace only
// (visibility = 'workspace'). Separate from the personal public feed.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orgId } = await params

    const membership = await getOrgMembership(orgId, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    const supabase = createServiceRoleClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    const { data: reflections, error: reflectionsError, count } = await supabase
      .from('reflections')
      .select(`
        id, prompt_text, reflection_text, mood, tags, word_count,
        visibility, created_at, allow_comments, user_id
      `, { count: 'exact' })
      .eq('workspace_id', orgId)
      .eq('visibility', 'workspace')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reflectionsError) throw reflectionsError

    const authorIds = [...new Set((reflections || []).map(r => r.user_id))]
    const profileMap = new Map<string, any>()
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url')
        .in('id', authorIds)
      profiles?.forEach(p => profileMap.set(p.id, p))
    }

    const reflectionIds = (reflections || []).map(r => r.id)
    let commentCounts: Record<string, number> = {}
    let likeCounts: Record<string, number> = {}
    let userLikedSet = new Set<string>()

    if (reflectionIds.length > 0) {
      try {
        const { data: counts } = await supabase.from('comments').select('reflection_id').in('reflection_id', reflectionIds)
        ;(counts as any[])?.forEach((c: any) => { commentCounts[c.reflection_id] = (commentCounts[c.reflection_id] || 0) + 1 })
      } catch {}

      try {
        const { data: likes } = await supabase.from('reflection_likes').select('reflection_id, user_id').in('reflection_id', reflectionIds)
        ;(likes as any[])?.forEach((l: any) => {
          likeCounts[l.reflection_id] = (likeCounts[l.reflection_id] || 0) + 1
          if (l.user_id === user.id) userLikedSet.add(l.reflection_id)
        })
      } catch {}
    }

    const feed = (reflections || []).map(r => ({
      reflection: {
        id: r.id,
        prompt_text: r.prompt_text,
        reflection_text: decryptIfEncrypted(r.reflection_text) || r.reflection_text,
        mood: r.mood,
        tags: r.tags,
        word_count: r.word_count,
        visibility: r.visibility,
        created_at: r.created_at,
        allow_comments: r.allow_comments,
      },
      author: profileMap.get(r.user_id) || null,
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
      { error: error.message || 'Failed to fetch workspace feed' },
      { status: 500 }
    )
  }
}
