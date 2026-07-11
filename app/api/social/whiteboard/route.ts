import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateEntrySchema = z.object({
  profile_user_id: z.string().uuid(),
  content_type: z.enum(['text', 'doodle', 'voice_note', 'sticker']),
  content: z.record(z.string(), z.any()),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_user_id')

    if (!profileId) {
      return NextResponse.json({ error: 'profile_user_id is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('whiteboard_entries')
      .select(`
        *,
        author:profiles!author_id(id, full_name, display_name, username, avatar_url)
      `)
      .eq('profile_user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch whiteboard entries' },
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
    const parsed = CreateEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('whiteboard_entries')
      .insert({
        profile_user_id: parsed.data.profile_user_id,
        author_id: user.id,
        content_type: parsed.data.content_type,
        content: parsed.data.content,
      })
      .select(`
        *,
        author:profiles!author_id(id, full_name, display_name, username, avatar_url)
      `)
      .single()

    if (error) throw error

    if (parsed.data.profile_user_id !== user.id) {
      await supabase
        .from('social_notifications')
        .insert({
          user_id: parsed.data.profile_user_id,
          type: 'whiteboard',
          actor_id: user.id,
        })
        .maybeSingle()
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create whiteboard entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('id')

    if (!entryId) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: entry } = await supabase
      .from('whiteboard_entries')
      .select('id, author_id, profile_user_id')
      .eq('id', entryId)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.author_id !== user.id && entry.profile_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('whiteboard_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Entry deleted' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete whiteboard entry' },
      { status: 500 }
    )
  }
}
