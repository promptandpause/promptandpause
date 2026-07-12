import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateCircleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // circle_members.friend_id -> public.users (same as reflections.user_id), not
    // profiles directly, so a nested profiles(...) embed here can't be resolved by
    // PostgREST. Fetch circles, then members, then profiles, and merge in JS.
    const { data: circles, error } = await supabase
      .from('circles')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const circleIds = (circles || []).map(c => c.id)
    let membersByCircle = new Map<string, any[]>()

    if (circleIds.length > 0) {
      const { data: members, error: membersError } = await supabase
        .from('circle_members')
        .select('circle_id, friend_id, added_at')
        .in('circle_id', circleIds)

      if (membersError) throw membersError

      const friendIds = [...new Set((members || []).map(m => m.friend_id))]
      const profileMap = new Map<string, any>()
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, display_name, username, avatar_url')
          .in('id', friendIds)
        profiles?.forEach(p => profileMap.set(p.id, p))
      }

      members?.forEach(m => {
        const enrichedMember = { ...m, profile: profileMap.get(m.friend_id) || null }
        const list = membersByCircle.get(m.circle_id) || []
        list.push(enrichedMember)
        membersByCircle.set(m.circle_id, list)
      })
    }

    const data = (circles || []).map(c => ({
      ...c,
      members: membersByCircle.get(c.id) || [],
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch circles' },
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
    const parsed = CreateCircleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('circles')
      .insert({ owner_id: user.id, name: parsed.data.name, description: parsed.data.description })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create circle' },
      { status: 500 }
    )
  }
}
