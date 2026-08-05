import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getAdminUser } from '@/lib/services/adminAuth'

const NOCOBASE_URL = process.env.NEXT_PUBLIC_NOCOBASE_URL || 'https://promptandpause-helpdesk.up.railway.app'

async function getAuthHeaders() {
  const res = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Role': 'root' },
    body: JSON.stringify({ email: process.env.NOCOBASE_EMAIL || 'admin@nocobase.com', password: process.env.NOCOBASE_PASSWORD || 'admin123' }),
  })
  if (!res.ok) throw new Error('Failed to authenticate with NocoBase')
  const data = await res.json()
  return { Authorization: `Bearer ${data.data?.token}`, 'X-Role': 'root' }
}

async function fetchTickets(headers: Record<string, string>) {
  const res = await fetch(
    `${NOCOBASE_URL}/api/tickets:list?pageSize=50&sort=-createdAt&appends=createdBy`,
    { headers },
  )
  if (!res.ok) throw new Error('Failed to fetch tickets')
  const { data } = await res.json()
  return data || []
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const headers = await getAuthHeaders()
    const tickets = await fetchTickets(headers)

    const enriched = await Promise.all(tickets.map(async (t: any) => {
      const submitterRes = await fetch(
        `${NOCOBASE_URL}/api/users:get/${t.createdById}`,
        { headers },
      )
      let submitter_email = ''
      if (submitterRes.ok) {
        const { data: submitter } = await submitterRes.json()
        submitter_email = submitter?.email || ''
      }

      const commentRes = await fetch(
        `${NOCOBASE_URL}/api/ticket_comments:list?filter[ticket_id][$eq]=${t.id}&pageSize=1`,
        { headers },
      )
      let commentCount = 0
      if (commentRes.ok) {
        const { meta } = await commentRes.json()
        commentCount = meta?.count || 0
      }

      return { ...t, submitter_email, comment_count: commentCount }
    }))

    return NextResponse.json({ tickets: enriched })
  } catch (error: any) {
    console.error('[Admin Tickets]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}