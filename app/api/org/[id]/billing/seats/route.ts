import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { updateOrgSeats } from '@/lib/services/orgService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const SeatSchema = z.object({
  seatCount: z.number().int().min(1).max(1000),
})

// POST /api/org/[id]/billing/seats -- change the number of paid seats
// (owner only). Updates the Stripe subscription quantity and the org row.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`org-seats:${user.id}`, { limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await request.json()
    const parsed = SeatSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const result = await updateOrgSeats(id, parsed.data.seatCount, user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true, seatCount: result.seatCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update seats' }, { status: 500 })
  }
}
