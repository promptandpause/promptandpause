import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { syncTicketFromHubSpot } from '@/lib/services/hubspotService'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Verify HubSpot webhook signature (v3)
 * @see https://developers.hubspot.com/docs/api/webhooks/validating-requests
 */
function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.HUBSPOT_SIGNING_SECRET
  if (!secret) {
    console.error('⚠️ HUBSPOT_SIGNING_SECRET not configured')
    return false
  }

  const signature = req.headers.get('x-hubspot-signature-v3')
  const timestamp = req.headers.get('x-hubspot-request-timestamp')
  
  if (!signature || !timestamp) {
    console.error('⚠️ Missing signature headers')
    return false
  }

  const method = req.method || 'POST'
  const url = req.nextUrl.pathname

  // HubSpot signature v3 canonical string: METHOD + URL + BODY + TIMESTAMP
  const sourceString = method + url + rawBody + timestamp
  
  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(sourceString)
      .digest('base64')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    )
  } catch (error) {
    console.error('⚠️ Signature verification error:', error)
    return false
  }
}

/**
 * Check if timestamp is within acceptable window (5 minutes)
 */
function isTimestampValid(timestamp: string): boolean {
  const requestTime = parseInt(timestamp, 10)
  const currentTime = Date.now()
  const fiveMinutesInMs = 5 * 60 * 1000

  if (isNaN(requestTime)) {
    return false
  }

  return Math.abs(currentTime - requestTime) <= fiveMinutesInMs
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(
  eventType: string,
  objectId: string,
  status: 'success' | 'failed',
  payload: any,
  error?: string
) {
  try {
    const supabase = await createServiceRoleClient()
    await supabase.from('hubspot_sync_log').insert({
      hubspot_ticket_id: objectId,
      sync_direction: 'from_hubspot',
      sync_status: status === 'success' ? 'synced' : 'failed',
      sync_data: payload,
      error_message: error,
      created_at: new Date().toISOString()
    })
  } catch (e) {
    console.error('Failed to log webhook event:', e)
  }
}

/**
 * Handle ticket.creation events
 */
async function handleTicketCreation(objectId: string, payload: any) {
  console.log('📩 HubSpot ticket.creation:', objectId)
  
  try {
    const result = await syncTicketFromHubSpot(objectId)
    await logWebhookEvent('ticket.creation', objectId, 'success', payload)
    return result
  } catch (error: any) {
    console.error('❌ Failed to sync new ticket from HubSpot:', error)
    await logWebhookEvent('ticket.creation', objectId, 'failed', payload, error.message)
    throw error
  }
}

/**
 * Handle ticket.propertyChange events
 */
async function handleTicketPropertyChange(objectId: string, propertyName: string, payload: any) {
  console.log(`📝 HubSpot ticket.propertyChange: ${objectId} (${propertyName})`)
  
  // Only sync for properties we care about
  const relevantProperties = [
    'hs_ticket_subject',
    'hs_pipeline_stage',
    'pnp_category',
    'pnp_priority',
    'pnp_user_tier',
    'content'
  ]

  if (!relevantProperties.includes(propertyName)) {
    console.log(`⏭️  Skipping non-relevant property: ${propertyName}`)
    return { skipped: true }
  }

  try {
    const result = await syncTicketFromHubSpot(objectId)
    await logWebhookEvent('ticket.propertyChange', objectId, 'success', payload)
    return result
  } catch (error: any) {
    console.error('❌ Failed to sync ticket property change:', error)
    await logWebhookEvent('ticket.propertyChange', objectId, 'failed', payload, error.message)
    throw error
  }
}

/**
 * Handle ticket.deletion events
 */
async function handleTicketDeletion(objectId: string, payload: any) {
  console.log('🗑️  HubSpot ticket.deletion:', objectId)
  
  try {
    const supabase = await createServiceRoleClient()
    
    // Mark local ticket as closed instead of deleting
    const { data, error } = await supabase
      .from('support_requests')
      .update({
        status: 'closed',
        sync_status: 'synced',
        updated_at: new Date().toISOString()
      })
      .eq('hubspot_ticket_id', objectId)
      .select()

    if (error) throw error

    await logWebhookEvent('ticket.deletion', objectId, 'success', payload)
    
    return { closed: data?.length || 0 }
  } catch (error: any) {
    console.error('❌ Failed to handle ticket deletion:', error)
    await logWebhookEvent('ticket.deletion', objectId, 'failed', payload, error.message)
    throw error
  }
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
  console.log('🔔 Incoming HubSpot webhook')

  // Read raw body for signature verification
  const rawBody = await req.text()
  
  // 1. Verify timestamp
  const timestamp = req.headers.get('x-hubspot-request-timestamp') || ''
  if (!isTimestampValid(timestamp)) {
    console.error('❌ Webhook timestamp invalid or too old')
    return NextResponse.json(
      { error: 'Invalid timestamp' },
      { status: 401 }
    )
  }

  // 2. Verify signature
  if (!verifySignature(req, rawBody)) {
    console.error('❌ Webhook signature verification failed')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  console.log('✅ Webhook signature verified')

  // 3. Parse and process events
  try {
    const events = JSON.parse(rawBody)
    
    if (!Array.isArray(events)) {
      console.error('❌ Invalid webhook payload format')
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    console.log(`📦 Processing ${events.length} event(s)`)

    // Process events asynchronously (don't block webhook response)
    const results = []
    
    for (const event of events) {
      const { objectId, subscriptionType, propertyName } = event

      console.log(`Event: ${subscriptionType} for ${objectId}`)

      try {
        let result

        switch (subscriptionType) {
          case 'ticket.creation':
            result = await handleTicketCreation(objectId, event)
            break

          case 'ticket.propertyChange':
            result = await handleTicketPropertyChange(objectId, propertyName, event)
            break

          case 'ticket.deletion':
            result = await handleTicketDeletion(objectId, event)
            break

          default:
            console.log(`⏭️  Unhandled event type: ${subscriptionType}`)
            result = { skipped: true }
        }

        results.push({ objectId, subscriptionType, success: true, result })
      } catch (error: any) {
        console.error(`❌ Error processing event ${subscriptionType} for ${objectId}:`, error)
        results.push({ 
          objectId, 
          subscriptionType, 
          success: false, 
          error: error.message 
        })
        // Continue processing other events even if one fails
      }
    }

    console.log('✅ Webhook processing complete')

    // Return success quickly to HubSpot (within their timeout)
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET handler for webhook verification during setup
 */
export async function GET(req: NextRequest) {
  // HubSpot may send a GET request during webhook setup
  const challenge = req.nextUrl.searchParams.get('challenge')
  
  if (challenge) {
    console.log('✅ Webhook verification challenge received')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({
    message: 'HubSpot webhook endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}
