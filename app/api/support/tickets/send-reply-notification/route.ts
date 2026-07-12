import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    let email: string | undefined
    let ticket_no: string | undefined
    let ticket_title: string | undefined
    let comment: string | undefined

    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = await request.json()
      email = body.email
      ticket_no = body.ticket_no
      ticket_title = body.ticket_title
      comment = body.comment
    } else {
      const form = await request.formData()
      email = form.get('email') as string
      ticket_no = form.get('ticket_no') as string
      ticket_title = form.get('ticket_title') as string
      comment = form.get('comment') as string
    }

    if (!email || !ticket_no || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, ticket_no, comment' },
        { status: 400 },
      )
    }

    const result = await sendTicketReplyNotification({
      email,
      name: email,
      ticketNo: ticket_no,
      ticketTitle: ticket_title || 'Support Ticket',
      replyText: comment,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('send_reply_notification_api_error', { error })
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
