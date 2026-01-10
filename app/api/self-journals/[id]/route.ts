import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptIfEncrypted, encryptIfPossible } from '@/lib/utils/crypto'
import { z } from 'zod'

const UpdateSelfJournalSchema = z.object({
  journal_text: z.string().min(1).max(10000).optional(),
  mood: z.string().max(50).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('self_journals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    const journal = data
      ? { ...data, journal_text: decryptIfEncrypted(data.journal_text) || data.journal_text }
      : null

    return NextResponse.json({ success: true, data: journal })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch journal' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const parsed = UpdateSelfJournalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }

    if (parsed.data.journal_text !== undefined) {
      updateData.journal_text = encryptIfPossible(parsed.data.journal_text)
    }
    if (parsed.data.mood !== undefined) {
      updateData.mood = parsed.data.mood
    }
    if (parsed.data.tags !== undefined) {
      updateData.tags = parsed.data.tags
    }

    const { data, error } = await supabase
      .from('self_journals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    const returned = {
      ...data,
      journal_text: decryptIfEncrypted(data.journal_text) || data.journal_text,
    }

    return NextResponse.json({ success: true, data: returned })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update journal' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('self_journals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete journal' }, { status: 500 })
  }
}
