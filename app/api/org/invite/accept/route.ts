import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { acceptOrgInvite } from '@/lib/services/orgService'
import { z } from 'zod'

const AcceptSchema = z.object({
  token: z.string().min(1),
})

// POST /api/org/invite/accept -- accept an invite by token. Requires the
// user to be signed in with the exact email address the invite was sent to.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = AcceptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const result = await acceptOrgInvite(parsed.data.token, user.id, user.email || '')
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, organizationId: result.organizationId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to accept invite' }, { status: 500 })
  }
}
