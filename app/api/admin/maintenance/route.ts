import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getAllMaintenanceWindows, createMaintenanceWindow } from '@/lib/services/maintenanceService'
import { MaintenanceStatus } from '@/lib/types/maintenance'

/**
 * GET /api/admin/maintenance
 * List all maintenance windows with optional status filter
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as MaintenanceStatus | null

    // Fetch maintenance windows
    const result = await getAllMaintenanceWindows(status || undefined)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ maintenance_windows: result.data })
  } catch (error: any) {
    console.error('Error in GET /api/admin/maintenance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/maintenance
 * Create a new maintenance window (weekend-only validation enforced)
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

    // Parse and validate request body
    const body = await request.json()
    const { scheduled_date, start_time, end_time, affected_services, description } = body

    // Validation
    if (!scheduled_date || !start_time || !end_time || !affected_services) {
      return NextResponse.json(
        { error: 'Missing required fields: scheduled_date, start_time, end_time, affected_services' },
        { status: 400 }
      )
    }

    if (!Array.isArray(affected_services) || affected_services.length === 0) {
      return NextResponse.json(
        { error: 'affected_services must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(scheduled_date)) {
      return NextResponse.json(
        { error: 'Invalid scheduled_date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM or HH:MM:SS)
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM or HH:MM:SS' },
        { status: 400 }
      )
    }

    // Create maintenance window (weekend validation happens in service layer)
    const result = await createMaintenanceWindow({
      scheduled_date,
      start_time,
      end_time,
      affected_services,
      description,
      created_by: user.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ maintenance_window: result.data }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/maintenance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
