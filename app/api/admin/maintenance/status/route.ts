import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getMaintenanceMode, setMaintenanceMode } from '@/lib/services/maintenanceService'

/**
 * GET /api/admin/maintenance/status
 * Get current maintenance mode status
 */
export async function GET(request: NextRequest) {
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

    // Fetch maintenance mode status
    const result = await getMaintenanceMode()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ maintenance_mode: result.data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/maintenance/status
 * Toggle maintenance mode on/off
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { is_enabled, notes } = body

    // Validation
    if (typeof is_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'is_enabled must be a boolean value' },
        { status: 400 }
      )
    }

    // Update maintenance mode
    const result = await setMaintenanceMode({
      is_enabled,
      updated_by: user.id,
      notes,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Maintenance mode ${is_enabled ? 'enabled' : 'disabled'} successfully`,
      maintenance_mode: result.data,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
