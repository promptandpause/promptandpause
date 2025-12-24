import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { sendMaintenanceStartNotifications } from '@/lib/services/maintenanceService'

/**
 * POST /api/admin/maintenance/[id]/notify-start
 * Send maintenance start notifications to all active users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    // Send notifications (batch processing with rate limiting handled in service)
    const result = await sendMaintenanceStartNotifications(params.id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Maintenance start notifications sent successfully',
      batch_result: result.data,
    })
  } catch (error: any) {
    console.error(`Error in POST /api/admin/maintenance/${params.id}/notify-start:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
