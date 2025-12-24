import axios, { AxiosInstance } from 'axios'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Freshdesk API client singleton
let freshdeskClient: AxiosInstance | null = null

/**
 * Initialize Freshdesk API client with Basic Auth
 * @see https://developers.freshdesk.com/api/#authentication
 */
function initFreshdeskClient(): AxiosInstance | null {
  const domain = process.env.FRESHDESK_DOMAIN
  const apiKey = process.env.FRESHDESK_API_KEY
  const enabled = process.env.NEXT_PUBLIC_FRESHDESK_ENABLED === 'true'

  if (!enabled) {
    console.log('ℹ️ Freshdesk integration disabled')
    return null
  }

  if (!domain || !apiKey) {
    console.error('⚠️ Freshdesk credentials not configured')
    return null
  }

  if (!freshdeskClient) {
    freshdeskClient = axios.create({
      baseURL: `https://${domain}/api/v2`,
      auth: {
        username: apiKey,
        password: 'X' // Freshdesk uses API key as username, password can be anything
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
  }

  return freshdeskClient
}

/**
 * Status mapping: local → Freshdesk
 */
const STATUS_MAP = {
  open: 2,        // Freshdesk: Open
  in_progress: 3, // Freshdesk: Pending
  resolved: 4,    // Freshdesk: Resolved
  closed: 5       // Freshdesk: Closed
}

/**
 * Status mapping: Freshdesk → local
 */
const STATUS_MAP_REVERSE: Record<number, string> = {
  2: 'open',
  3: 'in_progress',
  4: 'resolved',
  5: 'closed'
}

/**
 * Priority mapping: local → Freshdesk
 */
const PRIORITY_MAP = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4
}

/**
 * Priority mapping: Freshdesk → local
 */
const PRIORITY_MAP_REVERSE: Record<number, string> = {
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'urgent'
}

/**
 * Category mapping to Freshdesk tags
 */
const CATEGORY_TAGS = {
  general: 'general',
  bug: 'bug',
  billing: 'billing',
  feature: 'feature-request',
  account: 'account',
  other: 'other'
}

/**
 * Create or update contact in Freshdesk
 */
export async function createOrUpdateContact(
  email: string,
  name?: string,
  phone?: string
): Promise<number | null> {
  const client = initFreshdeskClient()
  if (!client) return null

  try {
    // Try to find existing contact by email
    const searchResponse = await client.get('/contacts', {
      params: { email }
    })

    if (searchResponse.data && searchResponse.data.length > 0) {
      const contactId = searchResponse.data[0].id
      console.log('✅ Found existing Freshdesk contact:', contactId)
      
      // Update if name or phone changed
      if (name || phone) {
        await client.put(`/contacts/${contactId}`, {
          name: name || searchResponse.data[0].name,
          phone: phone || searchResponse.data[0].phone
        })
      }
      
      return contactId
    }

    // Create new contact
    const createResponse = await client.post('/contacts', {
      name: name || email.split('@')[0],
      email,
      phone: phone || null
    })

    console.log('✅ Created Freshdesk contact:', createResponse.data.id)
    return createResponse.data.id
  } catch (error: any) {
    // Handle duplicate email error gracefully
    if (error.response?.data?.errors?.[0]?.code === 'duplicate_value') {
      console.log('✅ Contact already exists with this email')
      // Try to find the existing contact by email
      try {
        const retryResponse = await client.get('/contacts', {
          params: { email }
        })
        if (retryResponse.data && retryResponse.data.length > 0) {
          return retryResponse.data[0].id
        }
      } catch (retryError) {
        console.error('❌ Failed to retrieve existing contact:', retryError)
      }
      return null
    }
    console.error('❌ Freshdesk contact error:', error.response?.data || error.message)
    return null
  }
}

/**
 * Map local support request to Freshdesk ticket format
 * Only includes fields that Freshdesk API actually supports
 */
function mapLocalToFreshdesk(local: any): any {
  // Build tags array - used for categorization
  const tags = [
    CATEGORY_TAGS[local.category as keyof typeof CATEGORY_TAGS] || 'general',
    local.source || 'dashboard',
    local.user_tier || 'freemium'
  ]

  // Minimal ticket payload - only required/supported fields
  // Return as mutable object so contact_id can be added later
  return {
    subject: local.subject || 'Support Request',
    description: local.message || '',
    priority: PRIORITY_MAP[local.priority as keyof typeof PRIORITY_MAP] || 2,
    status: STATUS_MAP[local.status as keyof typeof STATUS_MAP] || 2,
    tags
  }
}

/**
 * Create ticket in Freshdesk
 */
export async function createFreshdeskTicket(local: any): Promise<number> {
  const client = initFreshdeskClient()
  if (!client) throw new Error('Freshdesk not configured')

  let ticketData: any
  
  try {
    ticketData = mapLocalToFreshdesk(local)
    
    // Always include email and name - Freshdesk uses these to find/create contact
    ticketData.email = local.user_email
    ticketData.name = local.user_name || local.user_email.split('@')[0]
    
    console.log('📤 Sending ticket payload:', JSON.stringify(ticketData, null, 2))
    const response = await client.post('/tickets', ticketData)
    
    console.log('✅ Created Freshdesk ticket:', response.data.id)
    return response.data.id
  } catch (error: any) {
    console.error('❌ Failed to create Freshdesk ticket')
    console.error('   Status:', error.response?.status)
    console.error('   Error Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('   Message:', error.message)
    if (ticketData) {
      console.error('   Payload:', JSON.stringify(ticketData, null, 2))
    }
    throw error
  }
}

/**
 * Update existing Freshdesk ticket
 */
export async function updateFreshdeskTicket(
  ticketId: number,
  local: any
): Promise<void> {
  const client = initFreshdeskClient()
  if (!client) throw new Error('Freshdesk not configured')

  try {
    const updates = {
      subject: local.subject,
      priority: PRIORITY_MAP[local.priority as keyof typeof PRIORITY_MAP] || 2,
      status: STATUS_MAP[local.status as keyof typeof STATUS_MAP] || 2,
      tags: [
        CATEGORY_TAGS[local.category as keyof typeof CATEGORY_TAGS] || 'general',
        local.source || 'dashboard',
        local.user_tier || 'freemium'
      ]
    }

    await client.put(`/tickets/${ticketId}`, updates)
    console.log('✅ Updated Freshdesk ticket:', ticketId)
  } catch (error: any) {
    console.error('❌ Failed to update Freshdesk ticket:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get ticket from Freshdesk
 */
export async function getFreshdeskTicket(ticketId: number): Promise<any> {
  const client = initFreshdeskClient()
  if (!client) throw new Error('Freshdesk not configured')

  try {
    const response = await client.get(`/tickets/${ticketId}`, {
      params: { include: 'conversations' }
    })
    return response.data
  } catch (error: any) {
    console.error('❌ Failed to fetch Freshdesk ticket:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Add note/reply to Freshdesk ticket
 */
export async function addNoteToTicket(
  ticketId: number,
  body: string,
  isPrivate: boolean = false
): Promise<void> {
  const client = initFreshdeskClient()
  if (!client) throw new Error('Freshdesk not configured')

  try {
    await client.post(`/tickets/${ticketId}/notes`, {
      body,
      private: isPrivate
    })
    console.log('✅ Added note to Freshdesk ticket:', ticketId)
  } catch (error: any) {
    console.error('❌ Failed to add note:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Log sync operation to database
 */
async function logSync(payload: {
  ticket_id?: string
  freshdesk_ticket_id?: string
  sync_direction: 'to_freshdesk' | 'from_freshdesk'
  sync_status: 'synced' | 'failed'
  sync_data: any
  error_message?: string
}) {
  try {
    const supabase = await createServiceRoleClient()
    await supabase.from('hubspot_sync_log').insert({
      ...payload,
      hubspot_ticket_id: payload.freshdesk_ticket_id, // Using existing column for now
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log sync:', error)
  }
}

/**
 * Sync local support request to Freshdesk
 */
export async function syncTicketToFreshdesk(localId: string): Promise<{ ticketId?: number }> {
  const enabled = process.env.NEXT_PUBLIC_FRESHDESK_ENABLED === 'true'
  if (!enabled) {
    console.log('⏭️ Freshdesk sync skipped (disabled)')
    return {}
  }

  const supabase = await createServiceRoleClient()
  
  try {
    // Fetch local ticket
    const { data: local, error } = await supabase
      .from('support_requests')
      .select('*')
      .eq('id', localId)
      .single()

    if (error || !local) {
      throw error || new Error('Local ticket not found')
    }

    let freshdeskTicketId: number

    // Create or update in Freshdesk
    if (local.hubspot_ticket_id) {
      // Update existing (using hubspot_ticket_id column temporarily)
      freshdeskTicketId = parseInt(local.hubspot_ticket_id)
      await updateFreshdeskTicket(freshdeskTicketId, local)
    } else {
      // Create new
      freshdeskTicketId = await createFreshdeskTicket(local)
    }

    // Update local record with sync status
    await supabase
      .from('support_requests')
      .update({
        hubspot_ticket_id: freshdeskTicketId.toString(),
        hubspot_synced_at: new Date().toISOString(),
        sync_status: 'synced',
        sync_error: null
      })
      .eq('id', localId)

    // Log success
    await logSync({
      ticket_id: localId,
      freshdesk_ticket_id: freshdeskTicketId.toString(),
      sync_direction: 'to_freshdesk',
      sync_status: 'synced',
      sync_data: { local, freshdeskTicketId }
    })

    console.log('✅ Synced to Freshdesk:', { localId, freshdeskTicketId })
    return { ticketId: freshdeskTicketId }

  } catch (error: any) {
    console.error('❌ Sync to Freshdesk failed:', error.message)

    // Update local record with error
    await supabase
      .from('support_requests')
      .update({
        sync_status: 'failed',
        sync_error: error.message
      })
      .eq('id', localId)

    // Log failure
    await logSync({
      ticket_id: localId,
      sync_direction: 'to_freshdesk',
      sync_status: 'failed',
      sync_data: {},
      error_message: error.message
    })

    throw error
  }
}

/**
 * Sync Freshdesk ticket to local database
 */
export async function syncTicketFromFreshdesk(ticketId: number): Promise<{ id: string }> {
  const supabase = await createServiceRoleClient()

  try {
    // Fetch from Freshdesk
    const freshdeskTicket = await getFreshdeskTicket(ticketId)

    // Check if local ticket exists
    const { data: existing } = await supabase
      .from('support_requests')
      .select('*')
      .eq('hubspot_ticket_id', ticketId.toString())
      .single()

    const updates = {
      subject: freshdeskTicket.subject,
      message: freshdeskTicket.description_text || freshdeskTicket.description,
      status: STATUS_MAP_REVERSE[freshdeskTicket.status] || 'open',
      priority: PRIORITY_MAP_REVERSE[freshdeskTicket.priority] || 'medium',
      user_email: freshdeskTicket.email,
      user_name: freshdeskTicket.name,
      hubspot_ticket_id: ticketId.toString(),
      hubspot_synced_at: new Date().toISOString(),
      sync_status: 'synced' as const,
      sync_error: null
    }

    if (existing) {
      // Update existing
      await supabase
        .from('support_requests')
        .update(updates)
        .eq('id', existing.id)

      await logSync({
        ticket_id: existing.id,
        freshdesk_ticket_id: ticketId.toString(),
        sync_direction: 'from_freshdesk',
        sync_status: 'synced',
        sync_data: { freshdeskTicket, updates }
      })

      return { id: existing.id }
    } else {
      // Create new local ticket (from email-to-ticket)
      const { data: created } = await supabase
        .from('support_requests')
        .insert({
          ...updates,
          user_id: null,
          category: 'general',
          user_tier: 'freemium',
          source: 'email'
        })
        .select()
        .single()

      await logSync({
        ticket_id: created.id,
        freshdesk_ticket_id: ticketId.toString(),
        sync_direction: 'from_freshdesk',
        sync_status: 'synced',
        sync_data: { freshdeskTicket, created }
      })

      return { id: created.id }
    }
  } catch (error: any) {
    console.error('❌ Sync from Freshdesk failed:', error.message)

    await logSync({
      freshdesk_ticket_id: ticketId.toString(),
      sync_direction: 'from_freshdesk',
      sync_status: 'failed',
      sync_data: {},
      error_message: error.message
    })

    throw error
  }
}

/**
 * Test Freshdesk connection
 */
export async function testFreshdeskConnection(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  const client = initFreshdeskClient()
  
  if (!client) {
    return {
      success: false,
      message: 'Freshdesk not configured or disabled'
    }
  }

  try {
    // Test API by fetching account info (tickets endpoint)
    const response = await client.get('/tickets', { params: { per_page: 1 } })
    
    return {
      success: true,
      message: 'Freshdesk connection successful',
      details: {
        domain: process.env.FRESHDESK_DOMAIN,
        ticketCount: response.data.length
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Freshdesk connection failed',
      details: error.response?.data || error.message
    }
  }
}
