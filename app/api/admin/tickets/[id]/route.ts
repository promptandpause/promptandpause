import { NextRequest, NextResponse } from 'next/server'

const NOCOBASE_URL = process.env.NEXT_PUBLIC_NOCOBASE_URL || 'https://promptandpause-helpdesk.up.railway.app'

async function getAuthHeaders() {
  const res = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Role': 'root' },
    body: JSON.stringify({ email: process.env.NOCOBASE_EMAIL || 'admin@nocobase.com', password: process.env.NOCOBASE_PASSWORD || 'admin123' }),
  })
  if (!res.ok) throw new Error('Failed to authenticate')
  const data = await res.json()
  return { Authorization: `Bearer ${data.data?.token}`, 'X-Role': 'root' }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders()

    const [ticketRes, commentsRes] = await Promise.all([
      fetch(`${NOCOBASE_URL}/api/tickets:get/${params.id}`, { headers }),
      fetch(`${NOCOBASE_URL}/api/ticket_comments:list?filter[ticket_id][$eq]=${params.id}&sort=createdAt&pageSize=100&appends=createdBy`, { headers }),
    ])

    if (!ticketRes.ok) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    const { data: ticket } = await ticketRes.json()
    const { data: comments } = await commentsRes.json()

    let submitter = null
    if (ticket.createdById) {
      const userRes = await fetch(`${NOCOBASE_URL}/api/users:get/${ticket.createdById}`, { headers })
      if (userRes.ok) {
        const { data: u } = await userRes.json()
        submitter = u
      }
    }

    return NextResponse.json({ ticket: { ...ticket, submitter }, comments: comments || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { content } = await request.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const headers = await getAuthHeaders()

    const commentRes = await fetch(`${NOCOBASE_URL}/api/ticket_comments:create`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: parseInt(params.id),
        content: `[Staff reply]\n\n${content}`,
      }),
    })

    if (!commentRes.ok) return NextResponse.json({ error: 'Failed to create comment' }, { status: 502 })

    const { data: comment } = await commentRes.json()
    return NextResponse.json({ success: true, comment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}