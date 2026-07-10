import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'
    const tag = searchParams.get('tag') || ''

    if (!q.trim() && !tag.trim()) {
      return NextResponse.json({ success: true, data: { reflections: [], profiles: [] } })
    }

    let reflections: any[] = []
    let profiles: any[] = []

    const searchTerm = q.trim()
    const tagFilter = tag.trim().toLowerCase()

    // Search reflections by text or tags
    if (type === 'all' || type === 'reflections') {
      let query = supabase
        .from('reflections')
        .select(`
          id, prompt_text, reflection_text, mood, tags, word_count,
          visibility, created_at, user_id,
          profile:profiles!inner(id, full_name, display_name, username, avatar_url)
        `)
        .neq('visibility', 'private')

      if (tagFilter) {
        // Filter by specific tag
        query = query.contains('tags', [tagFilter])
      }

      if (searchTerm) {
        query = query.or(
          `reflection_text.ilike.%${searchTerm}%,prompt_text.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`
        )
      }

      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(30)

      reflections = (data || []).map(r => ({
        ...r,
        reflection_text: r.reflection_text?.slice(0, 300),
      }))
    }

    // Search profiles by name or username
    if (type === 'all' || type === 'profiles') {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url, bio')
        .or(
          `username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`
        )
        .limit(10)

      profiles = data || []
    }

    return NextResponse.json({ success: true, data: { reflections, profiles } })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
