import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Whitelist of event names we accept. Keeps the table clean and prevents
// arbitrary strings from being written by clients.
const ALLOWED_EVENTS = [
  'signup_completed',
  'onboarding_completed',
  'session_start',
  'reflection_started',
  'reflection_saved',
  'reflection_first_saved',
  'reminder_opt_in',
  'reminder_opt_out',
  'session_close_action',
] as const

const EventSchema = z.object({
  event: z.enum(ALLOWED_EVENTS),
  properties: z.record(z.string(), z.any()).optional().default({}),
})

/**
 * POST /api/events
 * Record a single activation/retention event for the authenticated user.
 * Body: { event: string, properties?: object }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = EventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.from('user_events').insert({
      user_id: user.id,
      event: parsed.data.event,
      properties: parsed.data.properties ?? {},
    })

    if (error) {
      // Do not throw — analytics must never block the user flow.
      return NextResponse.json({ success: false }, { status: 200 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
