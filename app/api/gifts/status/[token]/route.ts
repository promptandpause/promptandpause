import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token || token.length !== 32) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Fetch gift by token (public endpoint for redemption page)
    const { data: gift, error } = await supabase
      .from('gift_subscriptions')
      .select('status, duration_months, expires_at, redeemed_at, recipient_email')
      .eq('redemption_token', token)
      .single()

    if (error || !gift) {
      return NextResponse.json({
        valid: false,
        error: 'Gift not found',
      })
    }

    const now = new Date()
    const expiresAt = new Date(gift.expires_at)
    const isExpired = expiresAt < now

    return NextResponse.json({
      valid: gift.status === 'pending' && !isExpired,
      status: gift.status,
      duration_months: gift.duration_months,
      expires_at: gift.expires_at,
      redeemed_at: gift.redeemed_at,
      is_expired: isExpired,
      recipient_email_required: !!gift.recipient_email,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
