import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/security/rateLimit'

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 60 requests per minute
    const rateLimitResult = await withRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      })
    }

    // Get user profile info
    const supabase = createServiceRoleClient()
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
