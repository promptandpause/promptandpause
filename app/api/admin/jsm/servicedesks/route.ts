import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Jira Service Management integration is disabled',
    },
    { status: 410 }
  )
}
