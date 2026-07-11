import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SubmitPromptSchema = z.object({
  prompt_text: z.string().min(10).max(500),
  category: z.string().max(50).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit
    const sort = searchParams.get('sort') || 'newest'

    let query = supabase
      .from('community_prompts')
      .select(`
        *,
        user_vote:prompt_votes!left(vote_type)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .order(sort === 'top' ? 'votes_count' : 'created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (user) {
      query = query.eq('prompt_votes.user_id', user.id)
    }

    const { data, error, count } = await query

    if (error) throw error

    // author:profiles(...) can't be embedded directly here -- community_prompts.author_id
    // references public.users, not profiles, so there's no direct FK for PostgREST to
    // follow. Fetch author profiles separately instead, same fix as reflections/random-feed.
    const authorIds = [...new Set((data || []).map((p: any) => p.author_id).filter(Boolean))]
    const authorMap = new Map<string, any>()
    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username')
        .in('id', authorIds)
      authors?.forEach((a: any) => authorMap.set(a.id, a))
    }

    const prompts = (data || []).map(p => ({
      ...p,
      author: authorMap.get(p.author_id) || null,
      user_vote: p.user_vote?.[0]?.vote_type || null,
    }))

    return NextResponse.json({
      success: true,
      data: prompts,
      pagination: { page, limit, total: count || 0, hasMore: (offset + limit) < (count || 0) },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = SubmitPromptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('community_prompts')
      .insert({
        author_id: user.id,
        prompt_text: parsed.data.prompt_text,
        category: parsed.data.category,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit prompt' },
      { status: 500 }
    )
  }
}
