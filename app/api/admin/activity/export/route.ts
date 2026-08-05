import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, getAdminActivityLogs, logAdminActivity } from '@/lib/services/adminService'
import { getAdminUser } from '@/lib/services/adminAuth'

/**
 * Neutralize formula-injection characters in CSV cells.
 * Spreadsheet apps (Excel, Google Sheets) treat cells starting with
 * =, +, -, @, \t, or \r as formulas. Prefixing with a single-quote
 * forces text interpretation and the quote is hidden by most readers.
 */
function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '')
  // Escape double quotes for CSV
  const escaped = str.replace(/"/g, '""')
  // Neutralize formula-leading characters
  if (/^[=+\-@\t\r]/.test(escaped)) {
    return `"'${escaped}"`
  }
  return `"${escaped}"`
}

function logsToCSV(logs: any[]): string {
  const headers = ['Timestamp', 'Admin Email', 'Action Type', 'Target User ID', 'Target User Email', 'Details']
  const rows = logs.map(log => [
    new Date(log.created_at).toISOString(),
    log.admin_email,
    log.action_type,
    log.target_user_id || '',
    log.target_user_email || '',
    log.details ? JSON.stringify(log.details) : '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => sanitizeCsvCell(cell)).join(','))
  ].join('\n')

  return csvContent
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin authentication
    const authCheck = await checkAdminAuth(user.email || '')
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters (same as regular activity route)
    const searchParams = request.nextUrl.searchParams
    const action_type = searchParams.get('action_type') || undefined
    const admin_email = searchParams.get('admin_email') || undefined
    const target_user_id = searchParams.get('target_user_id') || undefined
    const search = searchParams.get('search') || undefined
    const start_date = searchParams.get('start_date') || undefined
    const end_date = searchParams.get('end_date') || undefined

    // Fetch ALL matching logs (no pagination for export)
    const result = await getAdminActivityLogs({
      limit: 10000, // Large limit for export
      offset: 0,
      action_type,
      admin_email,
      target_user_id,
      search,
      start_date,
      end_date,
    })

    // Convert to CSV
    const csv = logsToCSV(result.logs)

    // Log the export action
    await logAdminActivity({
      admin_email: authCheck.email!,
      action_type: 'export_data',
      target_user_id: undefined,
      details: {
        export_type: 'activity_logs',
        record_count: result.logs.length,
        filters: {
          action_type,
          admin_email,
          target_user_id,
          search,
          start_date,
          end_date,
        },
      },
    })

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export activity logs' },
      { status: 500 }
    )
  }
}
