import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/security/rateLimit'

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute
    const rateLimitResult = await withRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const supabase = createServiceRoleClient()

    // Get recent discount codes (last 50)
    const { data: codes, error } = await supabase
      .from('discount_codes')
      .select(`
        id,
        code,
        discount_type,
        user_id,
        used,
        used_by,
        created_at,
        expires_at,
        admin_notes,
        users!inner(
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Recent codes fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent codes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      codes: codes || [],
      count: codes?.length || 0,
    })

  } catch (error: any) {
    console.error('Recent codes API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
