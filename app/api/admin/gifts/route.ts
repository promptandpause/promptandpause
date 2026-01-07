import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'

export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || undefined)
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServiceRoleClient()

    let query = supabase
      .from('gift_subscriptions')
      .select(`
        id,
        purchaser_email,
        purchaser_name,
        recipient_email,
        recipient_user_id,
        duration_months,
        amount_paid,
        status,
        purchased_at,
        redeemed_at,
        expires_at,
        redemption_token,
        recipient:profiles!gift_subscriptions_recipient_user_id_fkey(id, email, full_name)
      `)
      .order('purchased_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      // Basic operational search (email/token). Note: or() requires PostgREST filter syntax.
      query = query.or(
        `purchaser_email.ilike.%${search}%,recipient_email.ilike.%${search}%,redemption_token.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch gifts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, gifts: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
