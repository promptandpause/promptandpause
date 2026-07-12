import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { getOrgMembership } from '@/lib/services/orgService'

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
      .select('id, name, slug, seat_count, plan, billing_interval, status, settings, created_at')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, organization: org, myRole: membership.role })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load workspace' }, { status: 500 })
  }
}
