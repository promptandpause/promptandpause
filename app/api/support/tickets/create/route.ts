import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createTicket } from '@/lib/services/nocobaseService'
import { withRateLimit } from '@/lib/security/rateLimit'

const TicketSchema = z.object({
  ticket_title: z.string().min(2).max(200),
  description_text: z.string().min(10).max(5000),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, 'auth')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = TicketSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { ticket_title, description_text, priority_level } = parsed.data

    const ticket = await createTicket({
      ticket_title,
      description_text,
      priority_level,
      submitter_name: user.user_metadata?.full_name || user.email,
      submitter_email: user.email,
    })

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticket_no,
        ticket_title: ticket.ticket_title,
        ticket_status: ticket.ticket_status,
        priority_level: ticket.priority_level,
        createdAt: ticket.createdAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
