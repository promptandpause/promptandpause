import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateCommentSchema = z.object({
  reflection_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
})

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('id')

    if (!commentId) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Either the comment's author OR the owner of the reflection it's on
    // can delete it (RLS also enforces this via two additive DELETE
    // policies, but we check explicitly here for a clean 403 vs a
    // generic RLS-denied error, and to know which case we're in)
    const { data: comment } = await supabase
      .from('comments')
      .select('id, author_id, reflection_id')
      .eq('id', commentId)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    let isAuthorized = comment.author_id === user.id

    if (!isAuthorized) {
      const { data: reflection } = await supabase
        .from('reflections')
        .select('user_id')
        .eq('id', comment.reflection_id)
        .single()
      isAuthorized = reflection?.user_id === user.id
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

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

    const supabase = await createClient()

    const { data: reflection } = await supabase
      .from('reflections')
      .select('user_id, visibility')
      .eq('id', reflectionId)
      .single()

    if (!reflection) {
      return NextResponse.json({ error: 'Reflection not found' }, { status: 404 })
    }

    if (reflection.visibility === 'private' && reflection.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles(id, full_name, display_name, username, avatar_url)
      `)
      .eq('reflection_id', reflectionId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
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
    const parsed = CreateCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { reflection_id, body: commentBody } = parsed.data
    const supabase = await createClient()

    const { data: reflection } = await supabase
      .from('reflections')
      .select('user_id, visibility, allow_comments')
      .eq('id', reflection_id)
      .single()

    if (!reflection) {
      return NextResponse.json({ error: 'Reflection not found' }, { status: 404 })
    }

    if (!reflection.allow_comments) {
      return NextResponse.json({ error: 'Comments are disabled on this reflection' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({ reflection_id, author_id: user.id, body: commentBody })
      .select(`
        *,
        author:profiles(id, full_name, display_name, username, avatar_url)
      `)
      .single()

    if (error) throw error

    if (reflection.user_id !== user.id) {
      await supabase
        .from('social_notifications')
        .insert({
          user_id: reflection.user_id,
          type: 'new_comment',
          actor_id: user.id,
          reflection_id,
        })
        .maybeSingle()
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}
