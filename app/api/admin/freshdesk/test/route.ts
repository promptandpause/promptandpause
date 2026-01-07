import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testFreshdeskConnection } from '@/lib/services/freshdeskService'
import { checkAdminAuth } from '@/lib/services/adminService'

/**
 * Admin-only endpoint to test Freshdesk API connection
 * GET /api/admin/freshdesk/test
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminAuth = await checkAdminAuth(user.email || undefined)
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Test Freshdesk connection
    const result = await testFreshdeskConnection()

    if (result.success) {
      return NextResponse.json({
        ok: true,
        message: result.message,
        details: result.details
      })
    } else {
      return NextResponse.json({
        ok: false,
        message: result.message,
        error: result.details
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
