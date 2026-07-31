import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { createOrgCheckoutSession } from '@/lib/services/orgService'
import { getMetaAttribution, sendMetaEvent } from '@/lib/meta/metaEventService'
import { rateLimitOr429 } from '@/lib/utils/rateLimitResponse'
import { z } from 'zod'

const CreateOrgSchema = z.object({
  orgName: z.string().min(2).max(100),
  seatCount: z.number().int().min(1).max(1000),
  billingInterval: z.enum(['monthly', 'annual']),
  metaEventId: z.string().optional(),
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

    const attribution = getMetaAttribution(request)

    const result = await createOrgCheckoutSession({
      userId: user.id,
      userEmail: user.email || profile?.email || '',
      orgName: parsed.data.orgName,
      seatCount: parsed.data.seatCount,
      billingInterval: parsed.data.billingInterval,
      metaConsent: attribution.consented,
      metaFbp: attribution.fbp,
      metaFbc: attribution.fbc,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Consent-gated CAPI InitiateCheckout (fire-and-forget, never blocks checkout).
    if (attribution.consented) {
      await sendMetaEvent({
        eventName: 'InitiateCheckout',
        eventId: parsed.data.metaEventId || `ic-org-${Date.now()}`,
        email: user.email || profile?.email || undefined,
        fbp: attribution.fbp,
        fbc: attribution.fbc,
        contentName: `Workspace (${parsed.data.seatCount} seats, ${parsed.data.billingInterval})`,
        eventSourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/setup`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined,
      })
    }

    return NextResponse.json({ success: true, checkoutUrl: result.checkoutUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create organization' }, { status: 500 })
  }
}
