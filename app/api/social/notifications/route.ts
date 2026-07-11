import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('social_notifications')
      .select(`
        *,
        actor:profiles!actor_id(id, full_name, display_name, username, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const { count: unread_count } = await supabase
      .from('social_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({
      success: true,
      data,
      unread_count: unread_count || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PUT() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('social_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
