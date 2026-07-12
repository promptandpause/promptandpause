import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'
import { logger } from '@/lib/utils/logger'

function parseQueryString(text: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const part of text.split('&')) {
    const eq = part.indexOf('=')
    if (eq === -1) {
      params[decodeURIComponent(part)] = ''
    } else {
      params[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1))
    }
  }
  return params
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    let rawText = ''
    try {
      rawText = await request.text()
      if (rawText) {
        try {
          body = JSON.parse(rawText)
        } catch {
          if (rawText.includes('=')) {
            body = parseQueryString(rawText)
          }
        }
      }
    } catch {
      // body is empty or not readable
    }

    const authQuery = request.nextUrl.searchParams.get('secret')
    const authHeader = request.headers.get('authorization')
    const headerValid = authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.CRON_SECRET
    const bodyValid = body.webhook_secret === process.env.CRON_SECRET
    const queryValid = authQuery === process.env.CRON_SECRET

    if (!headerValid && !bodyValid && !queryValid) {
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
