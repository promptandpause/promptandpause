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

const PDSDESK_SUPPORT_SYSTEM_USER_ID_FALLBACK = '99ceb56a-c574-4a6e-ac5a-f81cc7c61d93'

function normalizeSupportCategory(input: string): 'general' | 'bug' | 'billing' | 'feature' | 'account' | 'other' {
  const raw = (input ?? '').toString().trim().toLowerCase()
  if (!raw) return 'general'

  const allowed = new Set(['general', 'bug', 'billing', 'feature', 'account', 'other'])
  if (allowed.has(raw)) return raw as any

  if (raw.includes('bill')) return 'billing'
  if (raw.includes('subscr')) return 'billing'
  if (raw.includes('payment')) return 'billing'
  if (raw.includes('bug')) return 'bug'
  if (raw.includes('error')) return 'bug'
  if (raw.includes('feature')) return 'feature'
  if (raw.includes('request')) return 'feature'
  if (raw.includes('account')) return 'account'
  if (raw.includes('privacy')) return 'account'
  if (raw.includes('general')) return 'general'

  return 'other'
}

const SupportRequestSchema = z.object({
  category: z.string().min(1),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(120, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  priority: z.enum(['low', 'medium', 'high']),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  tier: z.string().optional().nullable()
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

    const enrichedBody: Record<string, unknown> = {
      ...(body ?? {}),
    }

    const rawUserEmail = typeof enrichedBody.userEmail === 'string' ? enrichedBody.userEmail.trim() : ''
    if (!rawUserEmail && user.email) {
      enrichedBody.userEmail = user.email
    }

    const rawUserName = typeof enrichedBody.userName === 'string' ? enrichedBody.userName.trim() : ''
    if (!rawUserName) {
      const emailForName =
        (typeof enrichedBody.userEmail === 'string' ? enrichedBody.userEmail : '') || user.email || ''
      enrichedBody.userName = emailForName.includes('@') ? emailForName.split('@')[0] : 'User'
    }

    const validation = SupportRequestSchema.safeParse(enrichedBody)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { category: rawCategory, subject, message, priority, userEmail, userName, tier } = validation.data
    const category = normalizeSupportCategory(rawCategory)

    const PDSDESK_URL = process.env.PDSDESK_SUPABASE_URL
    const PDSDESK_SERVICE_ROLE_KEY = process.env.PDSDESK_SUPABASE_SERVICE_ROLE_KEY
    const PDSDESK_SUPPORT_SYSTEM_USER_ID =
      process.env.PDSDESK_SUPPORT_SYSTEM_USER_ID || PDSDESK_SUPPORT_SYSTEM_USER_ID_FALLBACK

    // Create ticket in local database first
    let localTicketId: string
    const localTags: string[] = [`tier:${tier || 'freemium'}`, 'source:dashboard']
    try {
      const { data: ticket, error: dbError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: userEmail,
          subject,
          description: message,
          status: 'open',
          priority,
          category,
          tags: localTags,
        })
        .select()
        .single()

      if (dbError) throw dbError
      localTicketId = ticket.id
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
            user_email: userEmail,
            subject,
            description: message,
            status: 'open',
            priority,
            category,
            tags: localTags,
          })
          .select()
          .single()

        if (adminError) throw adminError
        localTicketId = ticket.id
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
        console.log('Creating PDSdesk ticket with config', {
          hasUrl: !!PDSDESK_URL,
          hasKey: !!PDSDESK_SERVICE_ROLE_KEY,
          hasUserId: !!PDSDESK_SUPPORT_SYSTEM_USER_ID,
        })

        const pdsdesk = createSupabaseClient(PDSDESK_URL, PDSDESK_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        // First, verify the system user exists
        const { data: systemUser, error: userError } = await pdsdesk
          .from('profiles')
          .select('id')
          .eq('id', PDSDESK_SUPPORT_SYSTEM_USER_ID)
          .maybeSingle()

        if (userError || !systemUser) {
          console.error('pdsdesk_system_user_not_found', {
            userId: PDSDESK_SUPPORT_SYSTEM_USER_ID,
            error: userError,
          })
        }

        // Find the operator group that handles support@promptandpause.com
        const { data: queueData, error: queueError } = await pdsdesk
          .from('operator_groups')
          .select('id')
          .eq('email_address', 'support@promptandpause.com')
          .eq('is_active', true)
          .maybeSingle()

        if (queueError) {
          console.error('pdsdesk_queue_lookup_failed', { error: queueError })
        } else if (!queueData) {
          console.warn('pdsdesk_no_queue_found', { email: 'support@promptandpause.com' })
        }

        const description = [
          `Dashboard support form submission`,
          `User: ${userName} <${userEmail}>`,
          `Category: ${category}`,
          `Priority: ${priority}`,
          tier ? `Tier: ${tier}` : null,
          '',
          message,
        ].filter(Boolean).join('\n')

        const ticketData = {
          title: subject,
          description,
          status: 'new',
          priority,
          category: 'Customer Support',
          requester_id: PDSDESK_SUPPORT_SYSTEM_USER_ID,
          requester_email: userEmail,
          requester_name: userName,
          created_by: PDSDESK_SUPPORT_SYSTEM_USER_ID,
          ticket_type: 'customer_service',
          channel: 'dashboard',
          mailbox: 'support@promptandpause.com',
          assignment_group_id: queueData?.id || null,
        }

        console.log('Inserting PDSdesk ticket', { ticketData })

        const { data: pdsTicket, error: pdsError } = await pdsdesk
          .from('tickets')
          .insert(ticketData)
          .select('id,ticket_number')
          .maybeSingle()

        if (pdsError) {
          console.error('pdsdesk_ticket_create_failed', {
            localTicketId,
            error: pdsError,
            queueData,
            userEmail,
            subject,
          })
        }

        if (!pdsError && pdsTicket?.id) {
          const pdsdeskTicketNumber = (pdsTicket as any).ticket_number as string | undefined
          externalTicketRef = pdsdeskTicketNumber || pdsTicket.id

          const pdsdeskTags = [
            `pdsdesk_ticket_id:${pdsTicket.id}`,
            ...(pdsdeskTicketNumber ? [`pdsdesk_ticket_number:${pdsdeskTicketNumber}`] : []),
          ]

          // Update local ticket with PDSdesk reference (if support_tickets has these columns)
          const updateData: any = { 
            tags: [...localTags, ...pdsdeskTags]
          }
          if (pdsdeskTicketNumber) {
            updateData.pdsdesk_ticket_number = pdsdeskTicketNumber
          }
          updateData.pdsdesk_ticket_id = pdsTicket.id
          
          await supabase
            .from('support_tickets')
            .update(updateData)
            .eq('id', localTicketId)

          try {
            await pdsdesk.from('ticket_events').insert({
              ticket_id: pdsTicket.id,
              actor_id: PDSDESK_SUPPORT_SYSTEM_USER_ID,
              event_type: 'dashboard_support_ingested',
              payload: {
                key: `dashboard:${localTicketId}`,
                localTicketId,
                userEmail,
                userName,
                category,
                priority,
                tier: tier || null,
              },
            })
          } catch (eventError) {
            console.error('pdsdesk_ticket_event_insert_failed', {
              localTicketId,
              pdsdeskTicketId: pdsTicket.id,
              error: eventError,
            })
          }
        } else {
          // PDSdesk ticket creation failed, but we still have a local ticket
          // Keep the local ticket ID as the reference
          console.warn('pdsdesk_ticket_not_created', {
            localTicketId,
            pdsError,
            queueData,
          })
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

