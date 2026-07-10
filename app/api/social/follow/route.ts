import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('target_id')

    // Get users I follow
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingSet = new Set((following || []).map(f => f.following_id))

    // If checking a specific user
    if (targetId) {
      return NextResponse.json({ success: true, data: { is_following: followingSet.has(targetId) } })
    }

    // Get follower and following counts for my profile
    const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        following_ids: Array.from(followingSet),
        following_count: followingCount || 0,
        follower_count: followerCount || 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createClient()
    const { target_id } = await request.json()

    if (!target_id) {
      return NextResponse.json({ error: 'target_id is required' }, { status: 400 })
    }
    if (target_id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', target_id)
      .maybeSingle()

    if (existing) {
      // Unfollow
      const { error: delError } = await supabase
        .from('follows')
        .delete()
        .eq('id', existing.id)

      if (delError) throw delError
      return NextResponse.json({ success: true, data: { following: false } })
    } else {
      // Follow
      const { error: insError } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: target_id })

      if (insError) throw insError
      return NextResponse.json({ success: true, data: { following: true } })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
