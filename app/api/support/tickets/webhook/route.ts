import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'afterUpdate' && data?.ticket_status === 'responded') {
      const submitterEmail = data.submitter_email
      const submitterName = data.submitter_name || submitterEmail

      if (submitterEmail) {
        sendTicketReplyNotification({
          email: submitterEmail,
          name: submitterName,
          ticketNo: data.ticket_no,
          ticketTitle: data.ticket_title,
          replyText: data.latest_reply || 'An agent has replied to your ticket.',
        }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
