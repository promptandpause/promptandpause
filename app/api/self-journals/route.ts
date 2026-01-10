import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptIfEncrypted, encryptIfPossible } from '@/lib/utils/crypto'
import { z } from 'zod'

const CreateSelfJournalSchema = z.object({
  journal_text: z.string().min(1, 'Journal text is required').max(10000, 'Journal text too long'),
  mood: z.string().max(50, 'Mood too long').optional().nullable(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Too many tags').optional().nullable(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('self_journals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const decrypted = (data || []).map((j: any) => ({
      ...j,
      journal_text: decryptIfEncrypted(j.journal_text) || j.journal_text,
    }))

    return NextResponse.json({ success: true, data: decrypted })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch journals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CreateSelfJournalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { journal_text, mood, tags } = parsed.data
    const encryptedText = encryptIfPossible(journal_text)

    const { data: inserted, error } = await supabase
      .from('self_journals')
      .insert({
        user_id: user.id,
        journal_text: encryptedText,
        mood: mood ?? null,
        tags: tags ?? [],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      {
        success: true,
        data: {
          ...inserted,
          journal_text,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create journal' }, { status: 500 })
  }
}
