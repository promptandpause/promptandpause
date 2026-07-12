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
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = await authenticate()

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const res = await fetch(
      `${NOCOBASE_URL}/api/tickets:list?filter[updatedAt][$gt]=${encodeURIComponent(fiveMinAgo)}&sort=updatedAt&pageSize=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch tickets' }, { status: 502 })
    }

    const { data: tickets } = await res.json()
    if (!tickets?.length) {
      return NextResponse.json({ success: true, checked: 0 })
    }

    let sent = 0
    for (const ticket of tickets) {
      if (!ticket.submitter_email) continue

      let commentText = 'An agent has replied to your ticket.'
      let shouldNotify = false

      const cRes = await fetch(
        `${NOCOBASE_URL}/api/ticket_comments:list?filter[ticket_id][$eq]=${ticket.id}&sort=createdAt&pageSize=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (cRes.ok) {
        const { data: comments } = await cRes.json()
        if (comments?.length) {
          const latest = comments[comments.length - 1]
          if (latest.createdById !== ticket.submitter_id) {
            commentText = latest.content || latest.description || commentText
            shouldNotify = true
          }
        }
      } else {
        shouldNotify = true
      }

      if (!shouldNotify && !ticket.ticket_status) continue

      await sendTicketReplyNotification({
        email: ticket.submitter_email,
        name: ticket.submitter_name || ticket.submitter_email,
        ticketNo: ticket.ticket_no,
        ticketTitle: ticket.ticket_title,
        replyText: commentText,
      })
      sent++
    }

    return NextResponse.json({ success: true, checked: tickets.length, sent })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
