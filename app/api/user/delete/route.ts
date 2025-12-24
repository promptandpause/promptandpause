import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * POST /api/user/delete
 *
 * Self-serve account deletion endpoint.
 * Requires user authentication. Uses service role to delete auth user and
 * relies on ON DELETE CASCADE to remove related data.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role to delete the user from auth.users (cascades to profiles, reflections, etc.)
    const admin = createServiceRoleClient()

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Account deleted' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
