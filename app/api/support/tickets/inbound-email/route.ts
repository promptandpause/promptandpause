import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

const NOCOBASE_URL = process.env.NEXT_PUBLIC_NOCOBASE_URL || 'https://promptandpause-helpdesk.up.railway.app'
const NOCOBASE_EMAIL = process.env.NOCOBASE_EMAIL || 'admin@nocobase.com'
const NOCOBASE_PASSWORD = process.env.NOCOBASE_PASSWORD || 'admin123'
const ROLE_HEADER = { 'X-Role': 'root' }

let authToken: string | null = null
let tokenExpiry = 0

async function authenticate(): Promise<Record<string, string>> {
  if (authToken && Date.now() < tokenExpiry) return { Authorization: `Bearer ${authToken}`, ...ROLE_HEADER }
  const res = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: NOCOBASE_EMAIL, password: NOCOBASE_PASSWORD }),
  })
  if (!res.ok) throw new Error('Failed to authenticate')
  const data = await res.json()
  authToken = data.data?.token
  tokenExpiry = Date.now() + 50 * 60 * 1000
  return { Authorization: `Bearer ${authToken}`, ...ROLE_HEADER }
}

const TICKET_NO_RE = /#(TKT-\d+)/i

function extractTicketNo(subject: string): string | null {
  const match = subject.match(TICKET_NO_RE)
  return match?.[1] || null
}

function extractReplyText(body: any): string {
  const text = body?.plain || body?.text || ''
  const lines = text.split('\n')
  const clean: string[] = []
  for (const line of lines) {
    if (
      /^>/.test(line) ||
      /^On .+ wrote:$/i.test(line.trim()) ||
      /^[-]{2,}Forwarded message[-]{2,}/i.test(line.trim()) ||
      line.includes('From:') && line.includes('Sent:') ||
      /^[-]+Original Message[-]+/i.test(line.trim())
    ) break
    clean.push(line)
  }
  return clean.join('\n').trim() || text.slice(0, 5000)
}

function extractSenderEmail(from: any): string | null {
  if (typeof from === 'string') {
    const m = from.match(/<(.+@.+)>/)
    return m?.[1] || null
  }
  return from?.email || from?.address || null
}

function extractSenderName(from: any): string | null {
  if (typeof from === 'string') {
    const m = from.match(/^"?([^"<]+)"?\s*</)
    return m?.[1]?.trim() || null
  }
  return from?.name || null
}

function extractToAddress(payload: any): string | null {
  const to = payload.to
  if (Array.isArray(to) && to.length) {
    const addr = to[0]
    return typeof addr === 'string' ? addr : addr?.email || addr?.address || null
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const subject = payload.subject || 'No subject'
    const fromEmail = extractSenderEmail(payload.from)
    const fromName = extractSenderName(payload.from)
    const bodyText = extractReplyText(payload.body)
    const toAddress = extractToAddress(payload)

    if (!fromEmail || !bodyText) {
      return NextResponse.json({ success: false, error: 'Missing sender or body' }, { status: 400 })
    }

    const headers = await authenticate()
    const ticketNo = extractTicketNo(subject)

    if (ticketNo) {
      const listRes = await fetch(
        `${NOCOBASE_URL}/api/tickets:list?filter[ticket_no][$eq]=${ticketNo}&pageSize=1`,
        { headers },
      )
      if (!listRes.ok) {
        return NextResponse.json({ success: false, error: 'Failed to find ticket' }, { status: 502 })
      }
      const { data: tickets } = await listRes.json()
      if (!tickets?.length) {
        return NextResponse.json({ success: false, error: 'Ticket not found' })
      }

      const ticket = tickets[0]

      const commentRes = await fetch(`${NOCOBASE_URL}/api/ticket_comments:create`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          content: `[Customer replied via email]\n\n${bodyText}`,
        }),
      })

      if (!commentRes.ok) {
        return NextResponse.json({ success: false, error: 'Failed to create comment' }, { status: 502 })
      }

      logger.info('inbound_email_comment_created', { ticketNo, fromEmail })
      return NextResponse.json({ success: true })
    }

    const isInternal = toAddress?.includes('servicedesk')
    const prefix = isInternal ? '[Internal]' : '[Email]'

    const ticketTitle = `${prefix} ${subject}`.slice(0, 200)

    const createRes = await fetch(`${NOCOBASE_URL}/api/tickets:create`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_title: ticketTitle,
        description_text: `${bodyText}\n\n---\nFrom: ${fromName || fromEmail}\nEmail: ${fromEmail}`,
        priority_level: isInternal ? 'medium' : 'medium',
        ticket_status: 'new',
        submitted_at: new Date().toISOString(),
      }),
    })

    if (!createRes.ok) {
      return NextResponse.json({ success: false, error: 'Failed to create ticket' }, { status: 502 })
    }

    const { data: newTicket } = await createRes.json()
    logger.info('inbound_email_ticket_created', { ticketNo: newTicket?.ticket_no, fromEmail, isInternal })
    return NextResponse.json({ success: true, ticketNo: newTicket?.ticket_no })
  } catch (error: any) {
    logger.error('inbound_email_error', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
