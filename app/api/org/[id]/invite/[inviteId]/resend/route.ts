import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { resendOrgInvite } from '@/lib/services/orgService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'

// POST /api/org/[id]/invite/[inviteId]/resend -- re-sends a pending invite
// with a fresh token + 7-day expiry (owner/admin only).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id, inviteId } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`org-resend-invite:${user.id}`, { limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const result = await resendOrgInvite(id, inviteId, user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to resend invite' }, { status: 500 })
  }
}
