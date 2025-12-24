import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import {
  validateHubSpotConfig,
  testHubSpotConnection,
  createOrUpdateContact
} from '@/lib/services/hubspotService'

/**
 * Test HubSpot Connection
 * GET /api/admin/hubspot/test
 * 
 * Tests HubSpot API connection and configuration
 * Admin-only endpoint
 */
export async function GET() {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate configuration
    const config = validateHubSpotConfig()

    // Test connection if configured
    let connectionTest = null
    if (config.configured) {
      connectionTest = await testHubSpotConnection()
    }

    // Test contact creation (if connection works)
    let contactTest = null
    if (connectionTest?.success) {
      try {
        contactTest = await createOrUpdateContact(
          'test@promptandpause.com',
          'Test User'
        )
      } catch (error: any) {
        contactTest = { error: error.message }
      }
    }

    return NextResponse.json({
      success: true,
      config,
      connection: connectionTest,
      contactCreation: contactTest ? { 
        success: !!contactTest && typeof contactTest === 'string',
        contactId: typeof contactTest === 'string' ? contactTest : null,
        error: typeof contactTest === 'object' ? contactTest.error : null
      } : null,
      message: config.configured && connectionTest?.success
        ? '✅ HubSpot is configured and working!'
        : '⚠️ HubSpot is not fully configured'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
