import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { decryptIfEncrypted } from '@/lib/utils/crypto'
import { z } from 'zod'

const BookmarkKind = z.enum(['saved', 'revisit'])

const CreateBookmarkSchema = z.object({
  reflection_id: z.string().uuid(),
  kind: BookmarkKind,
  revisit_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * GET /api/bookmarks?kind=saved|revisit&due=true
 * Returns the current user's bookmarks, joined with the reflection.
 * - kind (optional): filter to a single kind
 * - due=true (only valid when kind=revisit): only return bookmarks whose
 *   revisit_on is <= today
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const kindParam = searchParams.get('kind')
    const due = searchParams.get('due') === 'true'

    const kind = kindParam ? BookmarkKind.safeParse(kindParam) : null
    if (kindParam && (!kind || !kind.success)) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase
      .from('reflection_bookmarks')
      .select('id, reflection_id, kind, revisit_on, created_at, reflections(id, prompt_text, reflection_text, mood, tags, date, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (kind && kind.success) {
      query = query.eq('kind', kind.data)
    }
    if (due && kind?.success && kind.data === 'revisit') {
      const todayStr = new Date().toISOString().split('T')[0]
      query = query.lte('revisit_on', todayStr)
    }

    const { data, error } = await query
    if (error) throw error

    const decrypted = (data || []).map((row: any) => {
      const r = row.reflections
      if (r && r.reflection_text) {
        r.reflection_text = decryptIfEncrypted(r.reflection_text) || r.reflection_text
      }
      return row
    })

    return NextResponse.json({ success: true, data: decrypted })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookmarks
 * Body: { reflection_id, kind: 'saved' | 'revisit', revisit_on?: 'YYYY-MM-DD' }
 * Upserts on (user_id, reflection_id, kind) — toggling the same kind twice
 * will update the existing row (e.g. pushing revisit_on forward).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = CreateBookmarkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { reflection_id, kind, revisit_on } = parsed.data
    const supabase = await createClient()

    // Verify reflection exists and belongs to the user (RLS would block otherwise,
    // but this gives a clearer error).
    const { data: reflection, error: refErr } = await supabase
      .from('reflections')
      .select('id')
      .eq('id', reflection_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (refErr || !reflection) {
      return NextResponse.json({ error: 'Reflection not found' }, { status: 404 })
    }

    const payload = {
      user_id: user.id,
      reflection_id,
      kind,
      revisit_on: kind === 'revisit'
        ? (revisit_on || tomorrowStr())
        : null,
    }

    const { data, error } = await supabase
      .from('reflection_bookmarks')
      .upsert(payload, { onConflict: 'user_id,reflection_id,kind' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create bookmark' },
      { status: 500 }
    )
  }
}

function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
