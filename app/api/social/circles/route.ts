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

    const { data, error } = await supabase
      .from('circles')
      .select(`
        *,
        members:circle_members(
          friend_id,
          added_at,
          profile:profiles(id, full_name, display_name, username, avatar_url)
        )
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

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
