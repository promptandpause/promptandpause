import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { addCircleMember, removeCircleMember } from '@/lib/services/circleService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: circleId } = await params
    const body = await request.json()
    const { friend_id } = body

    if (!friend_id || typeof friend_id !== 'string') {
      return NextResponse.json({ error: 'friend_id is required' }, { status: 400 })
    }

    if (friend_id === user.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
    }

    const result = await addCircleMember({
      circleId,
      ownerId: user.id,
      friendId: friend_id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: circleId } = await params
    const body = await request.json()
    const { friend_id } = body

    if (!friend_id || typeof friend_id !== 'string') {
      return NextResponse.json({ error: 'friend_id is required' }, { status: 400 })
    }

    const result = await removeCircleMember({
      circleId,
      ownerId: user.id,
      friendId: friend_id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: 500 }
    )
  }
}
