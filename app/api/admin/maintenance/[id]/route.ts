import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { 
  getMaintenanceWindow, 
  updateMaintenanceWindow, 
  cancelMaintenanceWindow 
} from '@/lib/services/maintenanceService'

/**
 * GET /api/admin/maintenance/[id]
 * Get a single maintenance window with notification history
 */
export async function GET(
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

    // Fetch maintenance window
    const result = await getMaintenanceWindow(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ maintenance_window: result.data })
  } catch (error: any) {
    console.error(`Error in GET /api/admin/maintenance/${params.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/maintenance/[id]
 * Update maintenance window details
 */
export async function PUT(
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

    // Parse request body
    const body = await request.json()

    // Validate date format if provided
    if (body.scheduled_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(body.scheduled_date)) {
        return NextResponse.json(
          { error: 'Invalid scheduled_date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
    }

    // Validate time format if provided
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/
    if (body.start_time && !timeRegex.test(body.start_time)) {
      return NextResponse.json(
        { error: 'Invalid start_time format. Use HH:MM or HH:MM:SS' },
        { status: 400 }
      )
    }
    if (body.end_time && !timeRegex.test(body.end_time)) {
      return NextResponse.json(
        { error: 'Invalid end_time format. Use HH:MM or HH:MM:SS' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Update maintenance window (weekend validation happens in service layer)
    const result = await updateMaintenanceWindow(params.id, body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ maintenance_window: result.data })
  } catch (error: any) {
    console.error(`Error in PUT /api/admin/maintenance/${params.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/maintenance/[id]
 * Cancel a maintenance window
 */
export async function DELETE(
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

    // Cancel maintenance window
    const result = await cancelMaintenanceWindow(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Maintenance window cancelled successfully',
      maintenance_window: result.data 
    })
  } catch (error: any) {
    console.error(`Error in DELETE /api/admin/maintenance/${params.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
