import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { lookupOrgMemberCandidate } from '@/lib/services/orgService'

// GET /api/org/[id]/members/lookup?email=... -- owner/admin only. Tells the
// UI whether an email has an existing account (instant add), is already a
// member, or already has a pending invite -- so the add-user box can show the
// right copy before the admin clicks anything.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = request.nextUrl.searchParams.get('email') || ''
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: true, exists: false, alreadyMember: false, pendingInvite: false, name: null })
    }

    const result = await lookupOrgMemberCandidate(id, email, user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      exists: result.exists,
      name: result.name || null,
      alreadyMember: result.alreadyMember,
      pendingInvite: result.pendingInvite,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to look up email' }, { status: 500 })
  }
}
