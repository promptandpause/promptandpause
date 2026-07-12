import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyNotification } from '@/lib/services/emailService'

const NOCOBASE_URL = process.env.NEXT_PUBLIC_NOCOBASE_URL || 'https://promptandpause-helpdesk.up.railway.app'
const NOCOBASE_EMAIL = process.env.NOCOBASE_EMAIL || 'admin@nocobase.com'
const NOCOBASE_PASSWORD = process.env.NOCOBASE_PASSWORD || 'admin123'
const ROLE_HEADER = { 'X-Role': 'root' }

let authToken: string | null = null
let tokenExpiry = 0

async function authenticate(): Promise<{ token: string; headers: Record<string, string> }> {
  if (authToken && Date.now() < tokenExpiry) return { token: authToken, headers: { Authorization: `Bearer ${authToken}`, ...ROLE_HEADER } }
  const res = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: NOCOBASE_EMAIL, password: NOCOBASE_PASSWORD }),
  })
  if (!res.ok) throw new Error('Failed to authenticate')
  const data = await res.json()
  authToken = data.data?.token
  tokenExpiry = Date.now() + 50 * 60 * 1000
  return { token: authToken, headers: { Authorization: `Bearer ${authToken}`, ...ROLE_HEADER } }
}

export async function GET(request: NextRequest) {
  return handlePoll(request)
}

export async function POST(request: NextRequest) {
  return handlePoll(request)
}

async function handlePoll(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { headers } = await authenticate()

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const cRes = await fetch(
      `${NOCOBASE_URL}/api/ticket_comments:list?filter[createdAt][$gt]=${encodeURIComponent(fiveMinAgo)}&sort=createdAt&pageSize=10&appends=createdBy`,
      { headers },
    )

    if (!cRes.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 502 })
    }

    const { data: comments } = await cRes.json()
    if (!comments?.length) {
      return NextResponse.json({ success: true, checked: 0 })
    }

    function extractSubmitterInfo(desc: string): { email?: string; name?: string } {
      const emailMatch = desc.match(/Email:\s*(\S+@\S+)/)
      const nameMatch = desc.match(/From:\s*(.+)/)
      return {
        email: emailMatch?.[1],
        name: nameMatch?.[1]?.trim(),
      }
    }

    let sent = 0
    for (const comment of comments) {
      if (!comment.ticket_id) continue
      if (!comment.createdById) continue

      const tRes = await fetch(
        `${NOCOBASE_URL}/api/tickets:get/${comment.ticket_id}`,
        { headers },
      )
      if (!tRes.ok) continue
      const { data: ticket } = await tRes.json()
      if (!ticket?.description_text) continue

      const { email, name } = extractSubmitterInfo(ticket.description_text)
      if (!email) continue
      if (comment.createdById === ticket.createdById) continue

      await sendTicketReplyNotification({
        email,
        name: name || email,
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
