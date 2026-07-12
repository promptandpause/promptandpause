import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reflectionId = searchParams.get('reflection_id')

    if (!reflectionId) {
      return NextResponse.json({ error: 'reflection_id is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { count } = await supabase
      .from('reflection_likes')
      .select('id', { count: 'exact', head: true })
      .eq('reflection_id', reflectionId)

    const { data: userLike } = await supabase
      .from('reflection_likes')
      .select('id')
      .eq('reflection_id', reflectionId)
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: {
        count: count || 0,
        is_liked_by_me: !!userLike,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch likes' },
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

    const limited = await rateLimitOr429(`likes:${user.id}`, { limit: 30, windowMs: 60_000 })
    if (limited) return limited

    const { reflection_id } = await request.json()
    if (!reflection_id) {
      return NextResponse.json({ error: 'reflection_id is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: existing } = await supabase
      .from('reflection_likes')
      .select('id')
      .eq('reflection_id', reflection_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('reflection_likes')
        .delete()
        .eq('id', existing.id)

      return NextResponse.json({ success: true, data: { liked: false } })
    }

    await supabase
      .from('reflection_likes')
      .insert({ reflection_id, user_id: user.id })

    // Notify the reflection's author (skip if liking your own post)
    const { data: reflection } = await supabase
      .from('reflections')
      .select('user_id')
      .eq('id', reflection_id)
      .maybeSingle()

    if (reflection && reflection.user_id !== user.id) {
      await supabase
        .from('social_notifications')
        .insert({
          user_id: reflection.user_id,
          type: 'like',
          actor_id: user.id,
          reflection_id,
        })
        .maybeSingle()
    }

    return NextResponse.json({ success: true, data: { liked: true } })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
