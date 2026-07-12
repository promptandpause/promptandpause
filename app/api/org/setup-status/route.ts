import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

// GET /api/org/setup-status?session_id=cs_...
// Polled by /workspace/setup right after a Stripe redirect, since org
// creation happens asynchronously via webhook, not synchronously in the
// checkout redirect. Returns the organization once the webhook has run.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = request.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.type !== 'organization') {
      return NextResponse.json({ error: 'Not an organization checkout session' }, { status: 400 })
    }

    if (session.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('stripe_subscription_id', session.subscription as string)
      .maybeSingle()

    if (!org) {
      // Webhook hasn't processed yet -- the frontend should keep polling
      return NextResponse.json({ success: true, ready: false })
    }

    return NextResponse.json({ success: true, ready: true, organization: org })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check setup status' }, { status: 500 })
  }
}
