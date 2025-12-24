import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { setMaintenanceMode } from '@/lib/services/maintenanceService'

/**
 * POST /api/admin/maintenance/enable
 * Enable maintenance mode
 */
export async function POST(request: NextRequest) {
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

    // Parse optional notes from request body
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    // Enable maintenance mode
    const result = await setMaintenanceMode({
      is_enabled: true,
      updated_by: user.id,
      notes,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      maintenance_mode: result.data 
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/maintenance/enable:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
