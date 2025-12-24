import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getRateLimitBackend } from '@/lib/utils/rateLimit'

/**
 * GET /api/health/rate-limit
 * Returns the active rate-limit backend (upstash or memory).
 * Admin-only to avoid exposing internals.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await checkAdminAuth(user.email || '')
    if (!admin.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const backend = getRateLimitBackend()
    const upstashConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

    return NextResponse.json({ backend, upstashConfigured })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
