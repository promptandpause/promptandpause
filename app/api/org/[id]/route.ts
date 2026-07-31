import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { getOrgMembership, renameOrganization } from '@/lib/services/orgService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const RenameSchema = z.object({
  name: z.string().min(2).max(100),
})

// GET /api/org/[id] -- basic org details, for any active member
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

    // RLS-scoped client is fine here -- the org_select_members policy
    // already restricts this to active members of the org.
    const supabase = await createClient()
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, slug, seat_count, plan, billing_interval, status, settings, stripe_subscription_id, created_at')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, organization: org, myRole: membership.role })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load workspace' }, { status: 500 })
  }
}

// PATCH /api/org/[id] -- rename the workspace (owner/admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`org-rename:${user.id}`, { limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await request.json()
    const parsed = RenameSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const result = await renameOrganization(id, parsed.data.name, user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true, organization: result.organization })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to rename workspace' }, { status: 500 })
  }
}
