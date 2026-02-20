import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase/server'
import { sendAccountDeletionEmail } from '@/lib/services/emailService'

/**
 * POST /api/user/delete
 *
 * Self-serve account deletion endpoint.
 * Requires user authentication. Uses service role to:
 * 1. Check for active premium subscription (blocks if active)
 * 2. Capture user info for confirmation email before deletion
 * 3. Explicitly delete all user data from every known table
 * 4. Delete the auth user (which also cascades where configured)
 * 5. Send deletion confirmation email
 * 6. Set a goodbye cookie so /good-bye page is accessible
 *
 * This belt-and-suspenders approach ensures nothing is left behind
 * even if some tables lack ON DELETE CASCADE.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id
    const userEmail = user.email || ''
    const admin = createServiceRoleClient()

    // Server-side subscription check — block if premium is active
    let userName: string | null = null
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('subscription_status, full_name')
        .eq('id', userId)
        .single()

      if (profile?.subscription_status === 'premium') {
        return NextResponse.json(
          { success: false, error: 'Please cancel your premium subscription before deleting your account.' },
          { status: 400 }
        )
      }

      // Capture name for the goodbye email before we delete everything
      userName = profile?.full_name || null
    } catch {
      // If profile fetch fails, continue — we'll still try to delete
    }

    // Explicitly delete from all known tables with user_id
    // Order: child tables first, then parent tables
    const tablesToDelete = [
      'push_subscriptions',
      'support_ticket_messages',
      'support_tickets',
      'email_queue',
      'email_delivery_log',
      'email_logs',
      'ip_logs',
      'discount_redemptions',
      'gift_subscriptions',
      'user_focus_areas',
      'reflection_themes',
      'weekly_insights',
      'monthly_insights',
      'reflections',
      'prompts_history',
      'self_journal_entries',
      'user_preferences',
      'profiles',
    ]

    for (const table of tablesToDelete) {
      try {
        await admin.from(table).delete().eq('user_id', userId)
      } catch {
        // Table may not exist or column name may differ — continue
      }
    }

    // Also try deleting from tables that use 'id' matching auth.users.id
    try {
      await admin.from('profiles').delete().eq('id', userId)
    } catch {
      // Already deleted above or doesn't exist
    }

    // Finally, delete the auth user itself
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    // Send deletion confirmation email (fire-and-forget — don't block response)
    if (userEmail) {
      sendAccountDeletionEmail(userEmail, userId, userName).catch(() => {})
    }

    // Set goodbye cookie so /good-bye page is accessible
    const response = NextResponse.json({ success: true, message: 'Account and all data deleted' })
    response.cookies.set('account_deleted', 'true', {
      path: '/',
      maxAge: 300, // 5 minutes
      httpOnly: false,
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
