import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { vote_type } = body

    if (!['up', 'down'].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type. Use "up" or "down".' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('prompt_votes')
      .select('id, vote_type')
      .eq('prompt_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      if (existing.vote_type === vote_type) {
        await supabase.from('prompt_votes').delete().eq('id', existing.id)
        await supabase.rpc('decrement_prompt_votes', { prompt_id: id })
        return NextResponse.json({ success: true, vote: null })
      }

      await supabase.from('prompt_votes').update({ vote_type }).eq('id', existing.id)
      return NextResponse.json({ success: true, vote: vote_type })
    }

    await supabase.from('prompt_votes').insert({ prompt_id: id, user_id: user.id, vote_type })
    await supabase.rpc('increment_prompt_votes', { prompt_id: id })

    return NextResponse.json({ success: true, vote: vote_type }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to vote' },
      { status: 500 }
    )
  }
}
