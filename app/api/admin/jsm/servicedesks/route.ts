import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'External ticketing integration is disabled',
    },
    { status: 410 }
  )
}
