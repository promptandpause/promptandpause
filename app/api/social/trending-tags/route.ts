import { NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('reflections')
      .select('tags')
      .neq('visibility', 'private')
      .gte('created_at', sevenDaysAgo)

    if (error) throw error

    const tagCounts = new Map<string, number>()
    ;(data || []).forEach(r => {
      if (Array.isArray(r.tags)) {
        r.tags.forEach((tag: string) => {
          const t = tag.toLowerCase().trim()
          if (t) tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
        })
      }
    })

    const trending = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({ success: true, data: trending })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trending tags' },
      { status: 500 }
    )
  }
}
