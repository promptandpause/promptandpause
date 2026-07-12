import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let body: any = {}
    if (contentType.includes('application/json')) {
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
      }
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      for (const [key, val] of formData.entries()) {
        body[key] = val
      }
    } else {
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ success: false, error: 'Unsupported content type' }, { status: 400 })
      }
    }

    const authHeader = request.headers.get('authorization')
    const headerValid = authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.CRON_SECRET
    if (!headerValid && body.webhook_secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

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
