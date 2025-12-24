import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSupportEmail, sendSupportConfirmationEmail } from '@/lib/services/emailService'
import { createFreshdeskTicket } from '@/lib/services/freshdeskService'
import { z } from 'zod'
import { rateLimit } from '@/lib/utils/rateLimit'

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

    // Build ticket payload for Freshdesk
    const ticketPayload = {
      subject,
      message,
      user_email: userEmail,
      user_name: userName,
      category,
      priority,
      status: 'open', // Always create as open
      user_tier: tier || 'freemium',
      source: 'dashboard'
    }

    // Create ticket in local database first
    let localTicketId: string
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
      console.log('✅ Created local support ticket:', localTicketId)
    } catch (dbError) {
      console.error('❌ Local ticket creation failed:', dbError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create support ticket. Please try again.' 
        },
        { status: 500 }
      )
    }

    // Create ticket in Freshdesk
    let freshdeskTicketId: number
    try {
      freshdeskTicketId = await createFreshdeskTicket(ticketPayload)
      console.log('✅ Created Freshdesk ticket:', freshdeskTicketId)
      
      // Update local ticket with Freshdesk ID
      await supabase
        .from('support_tickets')
        .update({ 
          metadata: { 
            tier: tier || 'freemium',
            source: 'dashboard',
            freshdesk_ticket_id: freshdeskTicketId
          } 
        })
        .eq('id', localTicketId)
    } catch (freshdeskError) {
      console.error('❌ Freshdesk ticket creation failed:', freshdeskError)
      // Continue anyway - we have the local ticket
      freshdeskTicketId = 0
    }

    // Build ticket URL
    const freshdeskDomain = process.env.FRESHDESK_DOMAIN || 'your-domain.freshdesk.com'
    const ticketUrl = `https://${freshdeskDomain}/a/tickets/${freshdeskTicketId}`

    // Send confirmation email to user
    try {
      await sendSupportConfirmationEmail(
        userEmail,
        userName,
        subject,
        freshdeskTicketId.toString()
      )
      console.log('✅ Sent confirmation email to user')
    } catch (emailError) {
      console.error('⚠️ Failed to send user confirmation email (non-critical):', emailError)
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
        requestId: freshdeskTicketId.toString()
      })
      console.log('✅ Sent notification to support team')
    } catch (emailError) {
      console.error('⚠️ Failed to send support team notification (non-critical):', emailError)
      // Don't fail the request if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: localTicketId,
      freshdeskTicketId: freshdeskTicketId || null,
      ticketUrl: freshdeskTicketId ? ticketUrl : null
    })

  } catch (error) {
    console.error('❌ Error processing support request:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

