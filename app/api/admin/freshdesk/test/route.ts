import { NextResponse } from 'next/server'

/**
 * Admin-only endpoint to test Freshdesk API connection
 * GET /api/admin/freshdesk/test
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Freshdesk integration has been retired.'
    },
    { status: 410 }
  )
}
