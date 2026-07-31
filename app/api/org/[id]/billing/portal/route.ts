import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { getOrgBillingPortalUrl } from '@/lib/services/orgService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'

// POST /api/org/[id]/billing/portal -- returns a Stripe customer portal URL
// so the owner can update payment methods, invoices, or cancel (owner only).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`org-portal:${user.id}`, { limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const result = await getOrgBillingPortalUrl(id, user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true, url: result.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to open billing portal' }, { status: 500 })
  }
}
