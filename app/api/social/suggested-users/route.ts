import { NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: friendIds } = await supabase
      .from('friends')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const excludeIds = new Set<string>([user.id])
    friendIds?.forEach(f => {
      excludeIds.add(f.requester_id)
      excludeIds.add(f.addressee_id)
    })

    const excludeArray = Array.from(excludeIds)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, username, avatar_url, bio')
      .not('username', 'is', null)
      .not('id', 'in', `(${excludeArray.join(',')})`)
      .limit(5)

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
