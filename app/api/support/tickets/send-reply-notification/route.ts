import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'
import { logger } from '@/lib/utils/logger'

const NOCOBASE_URL = process.env.NEXT_PUBLIC_NOCOBASE_URL || 'https://promptandpause-helpdesk.up.railway.app'
const NOCOBASE_EMAIL = process.env.NOCOBASE_EMAIL || 'admin@nocobase.com'
const NOCOBASE_PASSWORD = process.env.NOCOBASE_PASSWORD || 'admin123'
const ROLE_HEADER = { 'X-Role': 'root' }

export async function POST(request: NextRequest) {
  try {
    let email: string | undefined
    let ticket_no: string | undefined
    let ticket_title: string | undefined
    let comment: string | undefined
    let comment_id: string | undefined

    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = await request.json()
      email = body.email
      ticket_no = body.ticket_no
      ticket_title = body.ticket_title
      comment = body.comment
      comment_id = body.comment_id
    } else {
      const form = await request.formData()
      email = form.get('email') as string
      ticket_no = form.get('ticket_no') as string
      ticket_title = form.get('ticket_title') as string
      comment = form.get('comment') as string
      comment_id = form.get('comment_id') as string
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

    if (comment_id) {
      try {
        const authRes = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: NOCOBASE_EMAIL, password: NOCOBASE_PASSWORD }),
        })
        if (authRes.ok) {
          const { data: { token } } = await authRes.json()
          await fetch(`${NOCOBASE_URL}/api/ticket_comments:update?filterByTk=${comment_id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, ...ROLE_HEADER, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply_notified: true }),
          })
        }
      } catch {
        // Non-critical: don't fail the response if marking fails
      }
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
