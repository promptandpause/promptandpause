import { NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'

// GET /api/org/mine -- workspaces the current user belongs to, for the
// workspace switcher / landing page.
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: memberships, error } = await supabase
      .from('organization_members')
      .select('role, organization:organizations(id, name, slug, seat_count, status)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (error) throw error

    const organizations = (memberships || [])
      .filter((m: any) => m.organization)
      .map((m: any) => ({ ...m.organization, myRole: m.role }))

    return NextResponse.json({ success: true, organizations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load workspaces' }, { status: 500 })
  }
}
