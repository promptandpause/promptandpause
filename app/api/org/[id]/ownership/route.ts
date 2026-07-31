import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { transferOrgOwnership } from '@/lib/services/orgService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const TransferSchema = z.object({
  userId: z.string().uuid(),
})

// POST /api/org/[id]/ownership -- transfer workspace ownership to another
// active member (owner only). The current owner is demoted to admin.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`org-ownership:${user.id}`, { limit: 5, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await request.json()
    const parsed = TransferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const result = await transferOrgOwnership(id, parsed.data.userId, user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to transfer ownership' }, { status: 500 })
  }
}
