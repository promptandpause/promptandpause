/**
 * HubSpot Service - Bidirectional Ticket Sync
 * 
 * Handles all HubSpot API interactions for support ticket management:
 * - Contact/Company CRM sync
 * - Ticket creation and updates
 * - Bidirectional sync with local database
 * - Rate limiting and error handling
 */

import { Client } from '@hubspot/api-client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

// =============================================================================
// TYPES
// =============================================================================

interface LocalTicket {
  id: string
  user_id?: string
  category: string
  subject: string
  message: string
  priority: string
  status: string
  user_email: string
  user_name: string
  user_tier: string
  source?: string
  hubspot_ticket_id?: string
  hubspot_contact_id?: string
  created_at?: string
  updated_at?: string
}

interface HubSpotTicketProperties {
  hs_ticket_subject: string
  content?: string
  hs_pipeline?: string
  hs_pipeline_stage?: string
  hs_ticket_priority?: string
  pnp_category?: string
  pnp_priority?: string
  pnp_user_tier?: string
  pnp_source?: string
  pnp_local_ticket_id?: string
}

interface SyncResult {
  success: boolean
  hubspotId?: string
  contactId?: string
  error?: string
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const HUBSPOT_ENABLED = process.env.NEXT_PUBLIC_HUBSPOT_ENABLED === 'true'
const PIPELINE_ID = process.env.HUBSPOT_PIPELINE_ID || 'default'

// Status mapping: local → HubSpot pipeline stages
// Note: You'll need to get actual stage IDs from HubSpot after creating pipeline
const STATUS_TO_STAGE: Record<string, string> = {
  'open': '1', // Replace with actual stage ID
  'in_progress': '2',
  'resolved': '3',
  'closed': '4',
}

// Reverse mapping: HubSpot stage → local status
const STAGE_TO_STATUS: Record<string, string> = {
  '1': 'open',
  '2': 'in_progress',
  '3': 'resolved',
  '4': 'closed',
}

// Priority mapping
const PRIORITY_MAP: Record<string, string> = {
  'low': 'LOW',
  'medium': 'MEDIUM',
  'high': 'HIGH',
}

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

let hubspotClient: Client | null = null

/**
 * Initialize HubSpot API client (singleton)
 */
export function initHubSpotClient(): Client | null {
  if (!HUBSPOT_ENABLED) {
    return null
  }

  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    logger.error('hubspot_init_error', { error: 'HUBSPOT_ACCESS_TOKEN not configured' })
    return null
  }

  if (!hubspotClient) {
    hubspotClient = new Client({ 
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN 
    })
  }

  return hubspotClient
}

// =============================================================================
// CONTACT MANAGEMENT
// =============================================================================

/**
 * Create or update contact in HubSpot CRM
 * Returns contact ID for association with tickets
 */
export async function createOrUpdateContact(
  email: string, 
  name?: string
): Promise<string | null> {
  const hs = initHubSpotClient()
  if (!hs) return null

  try {
    // Parse name into first/last
    const nameParts = (name || '').trim().split(' ')
    const firstname = nameParts[0] || 'User'
    const lastname = nameParts.slice(1).join(' ') || ''

    // Search for existing contact by email
    const searchRequest = {
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ' as const,
          value: email
        }]
      }],
      properties: ['email', 'firstname', 'lastname'],
      limit: 1
    }

    const searchResults = await hs.crm.contacts.searchApi.doSearch(searchRequest)
    
    // If contact exists, return ID
    if (searchResults.results && searchResults.results.length > 0) {
      logger.info('hubspot_contact_found', { email, contactId: searchResults.results[0].id })
      return searchResults.results[0].id
    }

    // Create new contact
    const createRequest = {
      properties: {
        email,
        firstname,
        lastname: lastname || 'User'
      }
    }

    const created = await hs.crm.contacts.basicApi.create(createRequest)
    logger.info('hubspot_contact_created', { email, contactId: created.id })
    
    return created.id
  } catch (error: any) {
    logger.error('hubspot_contact_error', { error: error.message, email })
    return null
  }
}

// =============================================================================
// TICKET SYNC - LOCAL TO HUBSPOT
// =============================================================================

/**
 * Map local ticket properties to HubSpot format
 */
function mapLocalToHubSpot(local: LocalTicket): HubSpotTicketProperties {
  return {
    hs_ticket_subject: local.subject,
    content: local.message,
    hs_pipeline: PIPELINE_ID,
    hs_pipeline_stage: STATUS_TO_STAGE[local.status] || STATUS_TO_STAGE['open'],
    hs_ticket_priority: PRIORITY_MAP[local.priority] || 'MEDIUM',
    pnp_category: local.category,
    pnp_priority: local.priority,
    pnp_user_tier: local.user_tier,
    pnp_source: local.source || 'dashboard',
    pnp_local_ticket_id: local.id,
  }
}

/**
 * Create new ticket in HubSpot
 */
export async function createHubSpotTicket(
  local: LocalTicket
): Promise<string | null> {
  const hs = initHubSpotClient()
  if (!hs) throw new Error('HubSpot not configured')

  try {
    // Create or get contact ID
    const contactId = await createOrUpdateContact(local.user_email, local.user_name)
    
    // Map properties
    const properties = mapLocalToHubSpot(local)

    // Create ticket
    const createRequest: any = {
      properties
    }

    // Associate with contact if available
    if (contactId) {
      createRequest.associations = [{
        to: { id: contactId },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 16 // Ticket to Contact
        }]
      }]
    }

    const created = await hs.crm.tickets.basicApi.create(createRequest)
    
    logger.info('hubspot_ticket_created', { 
      localId: local.id, 
      hubspotId: created.id,
      contactId 
    })

    return created.id
  } catch (error: any) {
    logger.error('hubspot_ticket_create_error', { 
      error: error.message, 
      localId: local.id 
    })
    throw error
  }
}

/**
 * Update existing ticket in HubSpot
 */
export async function updateHubSpotTicket(
  local: LocalTicket
): Promise<string> {
  const hs = initHubSpotClient()
  if (!hs) throw new Error('HubSpot not configured')

  try {
    // If no HubSpot ID, create new ticket
    if (!local.hubspot_ticket_id) {
      const newId = await createHubSpotTicket(local)
      if (!newId) throw new Error('Failed to create ticket')
      return newId
    }

    // Map properties
    const properties = mapLocalToHubSpot(local)

    // Update ticket
    await hs.crm.tickets.basicApi.update(local.hubspot_ticket_id, { properties })

    logger.info('hubspot_ticket_updated', { 
      localId: local.id, 
      hubspotId: local.hubspot_ticket_id 
    })

    return local.hubspot_ticket_id
  } catch (error: any) {
    logger.error('hubspot_ticket_update_error', { 
      error: error.message, 
      localId: local.id,
      hubspotId: local.hubspot_ticket_id 
    })
    throw error
  }
}

/**
 * Get ticket from HubSpot by ID
 */
export async function getHubSpotTicket(
  hubspotId: string,
  properties?: string[]
): Promise<any> {
  const hs = initHubSpotClient()
  if (!hs) throw new Error('HubSpot not configured')

  try {
    const defaultProps = [
      'hs_ticket_subject',
      'content',
      'hs_pipeline',
      'hs_pipeline_stage',
      'hs_ticket_priority',
      'pnp_category',
      'pnp_priority',
      'pnp_user_tier',
      'pnp_source',
      'pnp_local_ticket_id',
      'hs_lastmodifieddate'
    ]

    const ticket = await hs.crm.tickets.basicApi.getById(
      hubspotId,
      properties || defaultProps
    )

    return ticket
  } catch (error: any) {
    logger.error('hubspot_ticket_get_error', { 
      error: error.message, 
      hubspotId 
    })
    throw error
  }
}

// =============================================================================
// SYNC LOGGING
// =============================================================================

/**
 * Log sync operation to database
 */
async function logSync(
  supabase: any,
  payload: {
    ticket_id?: string
    hubspot_ticket_id?: string
    sync_direction: 'to_hubspot' | 'from_hubspot'
    sync_status: 'pending' | 'synced' | 'failed' | 'conflict'
    sync_data?: any
    error_message?: string
  }
) {
  try {
    await supabase.from('hubspot_sync_log').insert(payload)
  } catch (error: any) {
    logger.error('sync_log_error', { error: error.message, payload })
  }
}

// =============================================================================
// BIDIRECTIONAL SYNC
// =============================================================================

/**
 * Sync local ticket to HubSpot (create or update)
 */
export async function syncTicketToHubSpot(localId: string): Promise<SyncResult> {
  // Check if HubSpot is enabled
  if (!HUBSPOT_ENABLED) {
    return { success: true, error: 'HubSpot sync disabled' }
  }

  const supabase = createServiceRoleClient()

  try {
    // Get local ticket
    const { data: local, error: fetchError } = await supabase
      .from('support_requests')
      .select('*')
      .eq('id', localId)
      .single()

    if (fetchError || !local) {
      throw new Error(fetchError?.message || 'Ticket not found')
    }

    // Sync to HubSpot
    const hubspotId = await updateHubSpotTicket(local)
    
    // Get contact ID if available
    const contactId = await createOrUpdateContact(local.user_email, local.user_name)

    // Update local ticket with sync info
    await supabase
      .from('support_requests')
      .update({
        hubspot_ticket_id: hubspotId,
        hubspot_contact_id: contactId,
        hubspot_synced_at: new Date().toISOString(),
        sync_status: 'synced',
        sync_error: null
      })
      .eq('id', localId)

    // Log success
    await logSync(supabase, {
      ticket_id: localId,
      hubspot_ticket_id: hubspotId,
      sync_direction: 'to_hubspot',
      sync_status: 'synced',
      sync_data: local
    })

    return { success: true, hubspotId, contactId: contactId || undefined }
  } catch (error: any) {
    // Update local ticket with error
    await supabase
      .from('support_requests')
      .update({
        sync_status: 'failed',
        sync_error: error.message
      })
      .eq('id', localId)

    // Log failure
    await logSync(supabase, {
      ticket_id: localId,
      sync_direction: 'to_hubspot',
      sync_status: 'failed',
      error_message: error.message
    })

    return { success: false, error: error.message }
  }
}

/**
 * Sync HubSpot ticket to local database (webhook handler)
 */
export async function syncTicketFromHubSpot(hubspotId: string): Promise<SyncResult> {
  if (!HUBSPOT_ENABLED) {
    return { success: true, error: 'HubSpot sync disabled' }
  }

  const supabase = createServiceRoleClient()

  try {
    // Get ticket from HubSpot
    const hsTicket = await getHubSpotTicket(hubspotId)
    const props: any = hsTicket.properties || {}

    // Find local ticket by HubSpot ID or local ID
    let { data: local } = await supabase
      .from('support_requests')
      .select('*')
      .eq('hubspot_ticket_id', hubspotId)
      .single()

    // If not found by HubSpot ID, try by local ID
    if (!local && props.pnp_local_ticket_id) {
      const { data } = await supabase
        .from('support_requests')
        .select('*')
        .eq('id', props.pnp_local_ticket_id)
        .single()
      local = data
    }

    // Prepare updates from HubSpot
    const updates = {
      subject: props.hs_ticket_subject || 'Untitled',
      category: props.pnp_category || 'general',
      priority: props.pnp_priority || 'medium',
      user_tier: props.pnp_user_tier || 'freemium',
      status: STAGE_TO_STATUS[props.hs_pipeline_stage] || 'open',
      hubspot_ticket_id: hubspotId,
      hubspot_synced_at: new Date().toISOString(),
      sync_status: 'synced',
      sync_error: null
    }

    if (local) {
      // Update existing ticket
      await supabase
        .from('support_requests')
        .update(updates)
        .eq('id', local.id)

      await logSync(supabase, {
        ticket_id: local.id,
        hubspot_ticket_id: hubspotId,
        sync_direction: 'from_hubspot',
        sync_status: 'synced',
        sync_data: updates
      })

      return { success: true, hubspotId }
    } else {
      // Create new local ticket from HubSpot (email-origin)
      const insert = {
        user_id: null, // No user for email-origin tickets
        category: updates.category,
        subject: updates.subject,
        message: props.content || '',
        priority: updates.priority,
        status: updates.status,
        user_email: '', // Will be populated from contact associations
        user_name: '',
        user_tier: updates.user_tier,
        source: 'email',
        hubspot_ticket_id: hubspotId,
        hubspot_synced_at: updates.hubspot_synced_at,
        sync_status: 'synced'
      }

      const { data: created } = await supabase
        .from('support_requests')
        .insert(insert)
        .select()
        .single()

      await logSync(supabase, {
        ticket_id: created.id,
        hubspot_ticket_id: hubspotId,
        sync_direction: 'from_hubspot',
        sync_status: 'synced',
        sync_data: insert
      })

      return { success: true, hubspotId }
    }
  } catch (error: any) {
    await logSync(supabase, {
      hubspot_ticket_id: hubspotId,
      sync_direction: 'from_hubspot',
      sync_status: 'failed',
      error_message: error.message
    })

    return { success: false, error: error.message }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if HubSpot integration is enabled and configured
 */
export function isHubSpotEnabled(): boolean {
  return HUBSPOT_ENABLED && !!process.env.HUBSPOT_ACCESS_TOKEN
}

/**
 * Validate HubSpot configuration
 */
export function validateHubSpotConfig(): {
  configured: boolean
  hasToken: boolean
  hasPortalId: boolean
  enabled: boolean
} {
  return {
    configured: !!(process.env.HUBSPOT_ACCESS_TOKEN && process.env.HUBSPOT_PORTAL_ID),
    hasToken: !!process.env.HUBSPOT_ACCESS_TOKEN,
    hasPortalId: !!process.env.HUBSPOT_PORTAL_ID,
    enabled: HUBSPOT_ENABLED
  }
}

/**
 * Test HubSpot connection
 */
export async function testHubSpotConnection(): Promise<{
  success: boolean
  error?: string
  accountInfo?: any
}> {
  const hs = initHubSpotClient()
  if (!hs) {
    return { success: false, error: 'HubSpot not configured' }
  }

  try {
    // Try to fetch account info (lightweight test)
    const account = await hs.apiRequest({
      method: 'GET',
      path: '/account-info/v3/api-usage/daily',
    })

    return { success: true, accountInfo: account }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
