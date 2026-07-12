import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'

const NOCOBASE_URL = process.env.NEXT_PUBLIC_NOCOBASE_URL || 'https://promptandpause-helpdesk.up.railway.app'
const NOCOBASE_EMAIL = process.env.NOCOBASE_EMAIL || 'admin@nocobase.com'
const NOCOBASE_PASSWORD = process.env.NOCOBASE_PASSWORD || 'admin123'

let authToken: string | null = null
let tokenExpiry = 0

async function authenticate(): Promise<string> {
  if (authToken && Date.now() < tokenExpiry) return authToken
  const res = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: NOCOBASE_EMAIL, password: NOCOBASE_PASSWORD }),
  })
  if (!res.ok) throw new Error('Failed to authenticate')
  const data = await res.json()
  authToken = data.data?.token
  tokenExpiry = Date.now() + 50 * 60 * 1000
  return authToken
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('key') !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = await authenticate()

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const res = await fetch(
      `${NOCOBASE_URL}/api/ticket_comments:list?filter[createdAt][$gt]=${encodeURIComponent(fiveMinAgo)}&sort=createdAt&pageSize=10&appends=createdBy`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 502 })
    }

    const { data: comments } = await res.json()
    if (!comments?.length) {
      return NextResponse.json({ success: true, checked: 0 })
    }

    let sent = 0
    for (const comment of comments) {
      if (!comment.ticket_id) continue

      const tRes = await fetch(
        `${NOCOBASE_URL}/api/tickets:get/${comment.ticket_id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!tRes.ok) continue
      const { data: ticket } = await tRes.json()
      if (!ticket?.submitter_email) continue

      if (comment.createdById === ticket.submitter_id) continue

      await sendTicketReplyNotification({
        email: ticket.submitter_email,
        name: ticket.submitter_name || ticket.submitter_email,
        ticketNo: ticket.ticket_no,
        ticketTitle: ticket.ticket_title,
        replyText: comment.content || comment.description || '',
      })
      sent++
    }

    return NextResponse.json({ success: true, checked: comments.length, sent })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
