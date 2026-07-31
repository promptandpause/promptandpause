import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { getOrgMembership, getOrgMembers, addOrgMemberByEmail } from '@/lib/services/orgService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})

// GET /api/org/[id]/members -- roster + pending invites. Name/email/role/
// join date/last active only, never reflection content. See
// docs/architecture/WORKSPACE_B2B_ARCHITECTURE.md.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await getOrgMembership(id, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 })
    }

    const { members, pendingInvites } = await getOrgMembers(id)

    return NextResponse.json({ success: true, members, pendingInvites })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load members' }, { status: 500 })
  }
}

// POST /api/org/[id]/members -- add a member (owner/admin only). If the email
// already has an account they are added instantly; otherwise a token invite is
// emailed. Response distinguishes `added` vs `invited`.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`org-add-member:${user.id}`, { limit: 30, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const result = await addOrgMemberByEmail({
      organizationId: id,
      email: parsed.data.email,
      role: parsed.data.role,
      addedBy: user.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        added: result.added || false,
        invited: result.invited || false,
        member: result.member || null,
        invite: result.invite || null,
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send invite' }, { status: 500 })
  }
}
