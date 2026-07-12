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

  if (!res.ok) throw new Error('Failed to authenticate with helpdesk')

  const data = await res.json()
  authToken = data.data?.token || null
  if (!authToken) throw new Error('No token received from helpdesk')
  tokenExpiry = Date.now() + 50 * 60 * 1000
  return { token: authToken, headers: { Authorization: `Bearer ${authToken}`, ...ROLE_HEADER } }
}

export interface CreateTicketParams {
  ticket_title: string
  description_text?: string
  priority_level?: 'low' | 'medium' | 'high' | 'urgent'
  submitter_name?: string
  submitter_email?: string
}

export interface TicketResult {
  id: number
  ticket_no: string
  ticket_title: string
  ticket_status: string
  priority_level: string
  createdAt: string
}

export async function createTicket(params: CreateTicketParams): Promise<TicketResult> {
  const { headers } = await authenticate()

  const contactName = params.submitter_name || params.submitter_email || 'Anonymous'

  const body: Record<string, any> = {
    ticket_title: params.ticket_title,
    description_text: params.description_text || '',
    priority_level: params.priority_level || 'medium',
    ticket_status: 'new',
    submitted_at: new Date().toISOString(),
    submitter_email: params.submitter_email || '',
    submitter_name: contactName,
  }

  if (params.submitter_name || params.submitter_email) {
    body.description_text = [
      params.description_text,
      '',
      '---',
      `From: ${params.submitter_name || 'Anonymous'}`,
      params.submitter_email ? `Email: ${params.submitter_email}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  const res = await fetch(`${NOCOBASE_URL}/api/tickets:create`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to create ticket: ${err}`)
  }

  const data = await res.json()
  const ticket = data.data as TicketResult

  // Auto-create or update contact linked to this ticket
  if (params.submitter_email) {
    try {
      const existing = await fetch(
        `${NOCOBASE_URL}/api/contacts:list?filter[email][$eq]=${encodeURIComponent(params.submitter_email)}&pageSize=1`,
        { headers },
      )
      const existingData = await existing.json()
      const contactId = existingData.data?.[0]?.id

      if (!contactId) {
        const createRes = await fetch(`${NOCOBASE_URL}/api/contacts:create`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: contactName,
            email: params.submitter_email,
            status: 'active',
          }),
        })
        if (createRes.ok) {
          const newContact = await createRes.json()
          await fetch(
            `${NOCOBASE_URL}/api/tickets:update?filterByTk=${ticket.id}`,
            {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({ contact_id: newContact.data.id }),
            },
          )
        }
      } else {
        await fetch(
          `${NOCOBASE_URL}/api/tickets:update?filterByTk=${ticket.id}`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: contactId }),
          },
        )
      }
    } catch {
      // Non-blocking — ticket was created regardless
    }
  }

  return ticket
}

export async function listUserTickets(email: string): Promise<TicketResult[]> {
  const { headers } = await authenticate()

  const res = await fetch(
    `${NOCOBASE_URL}/api/tickets:list?filter[description_text][$contains]=${encodeURIComponent(email)}&sort=-createdAt&pageSize=20`,
    { headers },
  )

  if (!res.ok) return []

  const data = await res.json()
  return (data.data || []) as TicketResult[]
}

export async function getTicketStatus(taskId: string): Promise<any> {
  const { headers } = await authenticate()

  const res = await fetch(`${NOCOBASE_URL}/api/backups:restoreStatus?task=${taskId}`, { headers })

  if (!res.ok) return null
  return res.json()
}
