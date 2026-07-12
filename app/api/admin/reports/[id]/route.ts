import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import {
  checkAdminAuth,
  updateContentReportStatus,
  removeReportedContent,
} from '@/lib/services/adminService'

// PATCH /api/admin/reports/[id]
// Body: { status: 'reviewed' | 'dismissed' | 'actioned' }
//   -- OR --
// Body: { action: 'remove_content', target_type: 'reflection' | 'comment', target_id: string }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const body = await request.json()

    if (body.action === 'remove_content') {
      if (!body.target_type || !body.target_id) {
        return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 })
      }
      const result = await removeReportedContent(body.target_type, body.target_id, user.email)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (!body.status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const result = await updateContentReportStatus(id, body.status, user.email)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ report: result.report })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
