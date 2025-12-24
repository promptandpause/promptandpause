import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/services/adminUserService'

/**
 * Admin Access Verification API
 * Verifies if a user has admin access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { hasAccess: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user has admin access
    const hasAccess = user.email ? await isAdminUser(user.email) : false

    return NextResponse.json({ 
      hasAccess,
      email: user.email 
    })
  } catch (error: any) {
    return NextResponse.json(
      { hasAccess: false, error: error.message },
      { status: 500 }
    )
  }
}
