import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendSupportEmail, sendSupportConfirmationEmail } from '@/lib/services/emailService'
import { z } from 'zod'
import { rateLimit } from '@/lib/utils/rateLimit'

function makeErrorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const SupportRequestSchema = z.object({
  category: z.enum(['general', 'bug', 'billing', 'feature', 'account', 'other']),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(120, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  priority: z.enum(['low', 'medium', 'high']),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  tier: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting - 5 support requests per hour per user
    const rl = await rateLimit(`support:${user.id}`, { limit: 5, windowMs: 60 * 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many support requests. Please wait before submitting again.',
          retryAfter: rl.retryAfter 
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = SupportRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { category, subject, message, priority, userEmail, userName, tier } = validation.data

    const PDSDESK_URL = process.env.PDSDESK_SUPABASE_URL
    const PDSDESK_SERVICE_ROLE_KEY = process.env.PDSDESK_SUPABASE_SERVICE_ROLE_KEY
    const PDSDESK_SUPPORT_SYSTEM_USER_ID = process.env.PDSDESK_SUPPORT_SYSTEM_USER_ID

    // Create ticket in local database first
    let localTicketId: string
    let localTicketMetadata: Record<string, unknown> = {
      tier: tier || 'freemium',
      source: 'dashboard'
    }
    try {
      const { data: ticket, error: dbError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject,
          description: message,
          status: 'open',
          priority,
          category,
          metadata: {
            tier: tier || 'freemium',
            source: 'dashboard'
          }
        })
        .select()
        .single()

      if (dbError) throw dbError
      localTicketId = ticket.id
      if (ticket?.metadata && typeof ticket.metadata === 'object') {
        localTicketMetadata = ticket.metadata as Record<string, unknown>
      }
    } catch (dbError) {
      const errorId = makeErrorId()
      console.error('support_ticket_create_failed', {
        errorId,
        userId: user.id,
        error: dbError,
      })

      try {
        const supabaseAdmin = createServiceRoleClient()
        const { data: ticket, error: adminError } = await supabaseAdmin
          .from('support_tickets')
          .insert({
            user_id: user.id,
            subject,
            description: message,
            status: 'open',
            priority,
            category,
            metadata: {
              tier: tier || 'freemium',
              source: 'dashboard'
            }
          })
          .select()
          .single()

        if (adminError) throw adminError
        localTicketId = ticket.id
        if (ticket?.metadata && typeof ticket.metadata === 'object') {
          localTicketMetadata = ticket.metadata as Record<string, unknown>
        }
      } catch (adminError) {
        console.error('support_ticket_create_failed_service_role', {
          errorId,
          userId: user.id,
          error: adminError,
        })

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create support ticket. Please try again.',
            errorId,
          },
          { status: 500 }
        )
      }
    }

    if (!localTicketId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create support ticket. Please try again.'
        },
        { status: 500 }
      )
    }

    // Create a new PDSdesk ticket (always new) when configured
    let externalTicketRef: string = localTicketId
    try {
      if (PDSDESK_URL && PDSDESK_SERVICE_ROLE_KEY && PDSDESK_SUPPORT_SYSTEM_USER_ID) {
        const pdsdesk = createSupabaseClient(PDSDESK_URL, PDSDESK_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        const description = [
          `Dashboard support form submission`,
          `User: ${userName} <${userEmail}>`,
          `Category: ${category}`,
          `Priority: ${priority}`,
          tier ? `Tier: ${tier}` : null,
          '',
          message,
        ].filter(Boolean).join('\n')

        const { data: pdsTicket, error: pdsError } = await pdsdesk
          .from('tickets')
          .insert({
            title: subject,
            description,
            status: 'new',
            priority,
            category: 'Customer Support',
            requester_id: PDSDESK_SUPPORT_SYSTEM_USER_ID,
            created_by: PDSDESK_SUPPORT_SYSTEM_USER_ID,
            ticket_type: 'customer_service',
            channel: 'dashboard',
          })
          .select('id,ticket_number')
          .maybeSingle()

        if (pdsError) {
          console.error('pdsdesk_ticket_create_failed', {
            localTicketId,
            error: pdsError,
          })
        }

        if (!pdsError && pdsTicket?.id) {
          const pdsdeskTicketNumber = (pdsTicket as any).ticket_number as string | undefined
          externalTicketRef = pdsdeskTicketNumber || pdsTicket.id

          const mergedMetadata = {
            ...localTicketMetadata,
            pdsdesk_ticket_id: pdsTicket.id,
            ...(pdsdeskTicketNumber ? { pdsdesk_ticket_number: pdsdeskTicketNumber } : null),
          }

          await supabase
            .from('support_tickets')
            .update({ metadata: mergedMetadata })
            .eq('id', localTicketId)
        }
      }
    } catch (error) {
      console.error('pdsdesk_ticket_create_threw', {
        localTicketId,
        error,
      })
    }

    // Send confirmation email to user
    try {
      await sendSupportConfirmationEmail(
        userEmail,
        userName,
        subject,
        externalTicketRef
      )
    } catch (emailError) {
      // Don't fail the request if email notification fails
    }

    // Send internal notification to support team
    try {
      await sendSupportEmail({
        category,
        subject,
        message,
        priority,
        userEmail,
        userName,
        tier: tier || 'freemium',
        requestId: externalTicketRef
      })
    } catch (emailError) {
      // Don't fail the request if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: externalTicketRef
    })

  } catch (error) {
    const errorId = makeErrorId()
    console.error('support_contact_handler_failed', {
      errorId,
      error,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        errorId,
      },
      { status: 500 }
    )
  }
}

