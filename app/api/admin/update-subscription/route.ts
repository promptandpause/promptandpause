import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { z } from 'zod'

const BodySchema = z.object({
  userEmail: z.string().email(),
  tier: z.enum(['premium', 'freemium']),
  durationMonths: z.number().int().min(1).max(24).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Require authenticated admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin || !adminAuth.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate payload
    const body = await req.json().catch(() => null)
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const { userEmail, tier, durationMonths } = parsed.data

    // Calculate subscription end date
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + (durationMonths ?? 1))

    // Perform update using service role (server-only) AFTER admin auth
    const supabaseAdmin = createServiceRoleClient()
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: tier === 'premium' ? 'premium' : 'freemium',
        billing_cycle: tier === 'premium' ? 'monthly' : null,
        subscription_end_date: tier === 'premium' ? endDate.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', userEmail)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `User ${userEmail} updated to ${tier} tier`,
      data: data[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
