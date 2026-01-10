import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { encryptIfPossible, isEncrypted } from '@/lib/utils/crypto'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized - Valid Bearer token required' }, { status: 401 })
    }

    if (!process.env.ENCRYPTION_KEY) {
      return NextResponse.json({ error: 'ENCRYPTION_KEY is not configured' }, { status: 500 })
    }

    const supabase = createServiceRoleClient()

    const body = await request.json().catch(() => null)
    const batchSize = Math.min(500, Math.max(1, Number(body?.batch_size || 200)))

    const { data: rows, error } = await supabase
      .from('self_journals')
      .select('id, journal_text')
      .not('journal_text', 'like', 'enc:v1:%')
      .order('created_at', { ascending: true })
      .limit(batchSize)

    if (error) throw error

    const candidates = (rows || []).filter((r: any) => r?.journal_text && !isEncrypted(r.journal_text))

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, processed: 0, updated: 0, message: 'No plaintext journals found in this batch' })
    }

    let updated = 0
    for (const row of candidates) {
      const encrypted = encryptIfPossible(row.journal_text)
      if (encrypted === row.journal_text) continue

      const { error: updErr } = await supabase
        .from('self_journals')
        .update({ journal_text: encrypted, updated_at: new Date().toISOString() })
        .eq('id', row.id)

      if (updErr) throw updErr
      updated += 1
    }

    return NextResponse.json({ success: true, processed: candidates.length, updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to encrypt self journals' }, { status: 500 })
  }
}
