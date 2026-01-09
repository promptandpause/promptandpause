import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  _context: { params: { serviceDeskId?: string } | Promise<{ serviceDeskId?: string }> }
) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Jira Service Management integration is disabled',
    },
    { status: 410 }
  )
}
