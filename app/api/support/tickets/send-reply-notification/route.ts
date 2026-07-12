import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, ticket_no, ticket_title, comment } = body

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
