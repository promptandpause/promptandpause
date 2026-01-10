import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'

const ALLOWED_CRON_JOBS = new Set([
  'send-daily-prompts',
  'regenerate-weekly-insights',
  'encrypt-self-journals',
])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => null)
    const job_name = body?.job_name

    if (!job_name || typeof job_name !== 'string') {
      return NextResponse.json({ error: 'job_name is required' }, { status: 400 })
    }

    if (!ALLOWED_CRON_JOBS.has(job_name)) {
      return NextResponse.json({ error: 'Unsupported job_name' }, { status: 400 })
    }

    const origin = request.nextUrl.origin
    const cronUrl = new URL(`/api/cron/${job_name}`, origin)

    const cronResponse = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${cronSecret}`,
        'content-type': 'application/json',
      },
    })

    const text = await cronResponse.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = { message: text }
    }

    if (!cronResponse.ok) {
      return NextResponse.json(
        {
          error: json?.error || 'Cron job failed',
          details: json,
        },
        { status: cronResponse.status }
      )
    }

    return NextResponse.json({ success: true, data: json })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to trigger cron job' }, { status: 500 })
  }
}
