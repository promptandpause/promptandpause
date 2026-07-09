import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const FriendRequestSchema = z.object({
  addressee_id: z.string().uuid(),
})

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        requester:profiles!friends_requester_id_fkey(id, full_name, display_name, username, avatar_url),
        addressee:profiles!friends_addressee_id_fkey(id, full_name, display_name, username, avatar_url)
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    const friends = (data || []).map(f => {
      const isRequester = f.requester_id === user.id
      return {
        id: f.id,
        requester_id: f.requester_id,
        addressee_id: f.addressee_id,
        status: f.status,
        created_at: f.created_at,
        updated_at: f.updated_at,
        profile: isRequester ? f.addressee : f.requester,
      }
    })

    return NextResponse.json({ success: true, data: friends })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch friends' },
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
    const parsed = FriendRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { addressee_id } = parsed.data

    if (addressee_id === user.id) {
      return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('friends')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${user.id})`)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Friend relationship already exists', status: existing.status }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('friends')
      .insert({ requester_id: user.id, addressee_id })
      .select()
      .single()

    if (error) throw error

    // Create notification for the addressee
    await supabase
      .from('social_notifications')
      .insert({
        user_id: addressee_id,
        type: 'friend_request',
        actor_id: user.id,
      })
      .maybeSingle()

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send friend request' },
      { status: 500 }
    )
  }
}
