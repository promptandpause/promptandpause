import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/security/rateLimit'

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 60 requests per minute
    const rateLimitResult = await withRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const supabase = createServiceRoleClient()

    // Get user from session
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      })
    }

    // Get user profile info
    const { data: profile } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || null,
      },
    })

  } catch (error: any) {
    console.error('Auth status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
