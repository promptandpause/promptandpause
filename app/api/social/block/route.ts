import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const BlockSchema = z.object({
  target_id: z.string().uuid(),
})

// GET /api/social/block -> list of user ids the current user has blocked
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id, created_at')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load blocks' }, { status: 500 })
  }
}

// POST /api/social/block { target_id } -> block a user
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`block:${user.id}`, { limit: 20, windowMs: 60_000 })
    if (limited) return limited

    const body = await request.json()
    const parsed = BlockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    if (parsed.data.target_id === user.id) {
      return NextResponse.json({ error: "You can't block yourself" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('user_blocks')
      .insert({ blocker_id: user.id, blocked_id: parsed.data.target_id })

    // Unique constraint violation just means it's already blocked -- treat as success
    if (error && error.code !== '23505') throw error

    // Unfriend and unfollow in both directions when blocking, since a block
    // should supersede any existing social connection
    await supabase
      .from('friends')
      .delete()
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${parsed.data.target_id}),and(requester_id.eq.${parsed.data.target_id},addressee_id.eq.${user.id})`)

    await supabase
      .from('follows')
      .delete()
      .or(`and(follower_id.eq.${user.id},following_id.eq.${parsed.data.target_id}),and(follower_id.eq.${parsed.data.target_id},following_id.eq.${user.id})`)

    return NextResponse.json({ success: true, data: { blocked: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to block user' }, { status: 500 })
  }
}

// DELETE /api/social/block?target_id=<uuid> -> unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('target_id')
    if (!targetId) {
      return NextResponse.json({ error: 'target_id query param is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetId)

    if (error) throw error

    return NextResponse.json({ success: true, data: { blocked: false } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to unblock user' }, { status: 500 })
  }
}
