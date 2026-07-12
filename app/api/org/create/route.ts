import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { createOrgCheckoutSession } from '@/lib/services/orgService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const CreateOrgSchema = z.object({
  orgName: z.string().min(2).max(100),
  seatCount: z.number().int().min(1).max(1000),
  billingInterval: z.enum(['monthly', 'annual']),
})

// POST /api/org/create
// Starts Stripe checkout for a new organization. The organization row itself
// isn't created until the webhook confirms payment -- see handleOrgCheckoutCompleted.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await rateLimitOr429(`org-create:${user.id}`, { limit: 5, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await request.json()
    const parsed = CreateOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const result = await createOrgCheckoutSession({
      userId: user.id,
      userEmail: user.email || profile?.email || '',
      orgName: parsed.data.orgName,
      seatCount: parsed.data.seatCount,
      billingInterval: parsed.data.billingInterval,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, checkoutUrl: result.checkoutUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create organization' }, { status: 500 })
  }
}
