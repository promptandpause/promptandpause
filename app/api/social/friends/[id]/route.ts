import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!['accept', 'block'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "accept" or "block".' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: friend } = await supabase
      .from('friends')
      .select('*')
      .eq('id', id)
      .single()

    if (!friend) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friend.addressee_id !== user.id && action === 'accept') {
      return NextResponse.json({ error: 'Only the recipient can accept' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('friends')
      .update({ status: action === 'accept' ? 'accepted' : 'blocked', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (action === 'accept') {
      await supabase
        .from('social_notifications')
        .insert({
          user_id: friend.requester_id,
          type: 'friend_accepted',
          actor_id: user.id,
        })
        .maybeSingle()
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update friend request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const supabase = await createClient()

    const { data: friend } = await supabase
      .from('friends')
      .select('*')
      .eq('id', id)
      .single()

    if (!friend) {
      return NextResponse.json({ error: 'Friend relationship not found' }, { status: 404 })
    }

    if (friend.requester_id !== user.id && friend.addressee_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Friend removed' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove friend' },
      { status: 500 }
    )
  }
}
