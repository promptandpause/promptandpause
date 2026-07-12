import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const ReportSchema = z.object({
  target_type: z.enum(['reflection', 'comment', 'user']),
  target_id: z.string().uuid(),
  reason: z.enum(['spam', 'harassment', 'self_harm', 'hate_speech', 'inappropriate', 'other']),
  details: z.string().max(1000).optional(),
})

// POST /api/social/report -> flag a reflection, comment, or user for review
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`report:${user.id}`, { limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await request.json()
    const parsed = ReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        target_type: parsed.data.target_type,
        target_id: parsed.data.target_id,
        reason: parsed.data.reason,
        details: parsed.data.details,
      })

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Report submitted' }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 500 })
  }
}
