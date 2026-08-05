import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getAdminUser } from '@/lib/services/adminAuth'

/**
 * POST /api/admin/fix-user-preferences
 * 
 * Admin endpoint to fix user preferences that may have null or missing values.
 * This ensures all users have proper custom_days and prompt_frequency set.
 * 
 * Body:
 * - dryRun?: boolean - If true, just report what would be updated without updating
 * - setDefaultCustomDays?: boolean - Set default custom_days for users with null/empty
 * - setPromptFrequency?: boolean - Set prompt_frequency to 'custom' for users with custom_days
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin auth
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { 
      dryRun = false, 
      setDefaultCustomDays = true,
      setPromptFrequency = true,
    } = body

    const serviceSupabase = createServiceRoleClient()

    // Default days for free users
    const DEFAULT_CUSTOM_DAYS = ['monday', 'wednesday', 'friday']

    // Fetch all user preferences
    const { data: userPrefs, error: prefsError } = await serviceSupabase
      .from('user_preferences')
      .select('id, user_id, custom_days, prompt_frequency, daily_reminders')

    if (prefsError) {
      return NextResponse.json({ error: 'Failed to fetch preferences', details: prefsError.message }, { status: 500 })
    }

    if (!userPrefs || userPrefs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No user preferences found',
        updated: 0,
      })
    }

    // Fetch profiles to determine free vs premium
    const userIds = userPrefs.map(p => p.user_id)
    const { data: profiles } = await serviceSupabase
      .from('profiles')
      .select('id, subscription_status, billing_cycle')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    const results: any[] = []
    let updatedCount = 0
    let skippedCount = 0

    for (const pref of userPrefs) {
      const profile = profileMap.get(pref.user_id)
      const isFreeUser = profile?.subscription_status !== 'premium' && profile?.billing_cycle !== 'gift_trial'
      
      const updates: any = {}
      const reasons: string[] = []

      // Check if custom_days needs to be set
      if (setDefaultCustomDays && (!pref.custom_days || pref.custom_days.length === 0)) {
        updates.custom_days = DEFAULT_CUSTOM_DAYS
        reasons.push('set_default_custom_days')
      }

      // Check if prompt_frequency needs to be set to 'custom'
      if (setPromptFrequency && pref.custom_days && pref.custom_days.length > 0 && pref.prompt_frequency !== 'custom') {
        updates.prompt_frequency = 'custom'
        reasons.push('set_prompt_frequency_to_custom')
      }

      // Also ensure daily_reminders is true if it's null
      if (pref.daily_reminders === null) {
        updates.daily_reminders = true
        reasons.push('set_daily_reminders_true')
      }

      if (Object.keys(updates).length === 0) {
        results.push({
          user_id: pref.user_id,
          status: 'skipped',
          reason: 'no_updates_needed',
          current: {
            custom_days: pref.custom_days,
            prompt_frequency: pref.prompt_frequency,
            daily_reminders: pref.daily_reminders,
          },
        })
        skippedCount++
        continue
      }

      if (dryRun) {
        results.push({
          user_id: pref.user_id,
          status: 'would_update',
          updates,
          reasons,
          current: {
            custom_days: pref.custom_days,
            prompt_frequency: pref.prompt_frequency,
            daily_reminders: pref.daily_reminders,
          },
          is_free: isFreeUser,
        })
        updatedCount++
        continue
      }

      // Apply updates
      const { error: updateError } = await serviceSupabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', pref.user_id)

      if (updateError) {
        results.push({
          user_id: pref.user_id,
          status: 'error',
          error: updateError.message,
        })
      } else {
        results.push({
          user_id: pref.user_id,
          status: 'updated',
          updates,
          reasons,
        })
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Fix completed',
      stats: {
        totalUsers: userPrefs.length,
        updated: updatedCount,
        skipped: skippedCount,
      },
      results,
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/fix-user-preferences
 * 
 * Get a report of user preferences that need fixing
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await checkAdminAuth(user.email || '')
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Fetch all user preferences
    const { data: userPrefs } = await serviceSupabase
      .from('user_preferences')
      .select('user_id, custom_days, prompt_frequency, daily_reminders')

    const stats = {
      total: userPrefs?.length || 0,
      custom_days_null: userPrefs?.filter(p => p.custom_days === null).length || 0,
      custom_days_empty: userPrefs?.filter(p => p.custom_days && p.custom_days.length === 0).length || 0,
      custom_days_set: userPrefs?.filter(p => p.custom_days && p.custom_days.length > 0).length || 0,
      prompt_frequency_null: userPrefs?.filter(p => p.prompt_frequency === null).length || 0,
      prompt_frequency_daily: userPrefs?.filter(p => p.prompt_frequency === 'daily').length || 0,
      prompt_frequency_custom: userPrefs?.filter(p => p.prompt_frequency === 'custom').length || 0,
      prompt_frequency_other: userPrefs?.filter(p => p.prompt_frequency && !['daily', 'custom'].includes(p.prompt_frequency)).length || 0,
      daily_reminders_true: userPrefs?.filter(p => p.daily_reminders === true).length || 0,
      daily_reminders_false: userPrefs?.filter(p => p.daily_reminders === false).length || 0,
      daily_reminders_null: userPrefs?.filter(p => p.daily_reminders === null).length || 0,
    }

    // Find users that need fixing
    const needsFix = userPrefs?.filter(p => 
      p.custom_days === null || 
      (p.custom_days && p.custom_days.length === 0) ||
      p.daily_reminders === null ||
      (p.custom_days && p.custom_days.length > 0 && p.prompt_frequency !== 'custom')
    ) || []

    return NextResponse.json({
      success: true,
      stats,
      needsFixCount: needsFix.length,
      usersNeedingFix: needsFix.slice(0, 20), // Show first 20
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
