import { createServiceRoleClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { logger } from '@/lib/utils/logger'
import { isAdminUser } from '@/lib/services/adminUserService'

/**
 * Admin Service
 * 
 * Handles admin-specific operations including:
 * - Admin authentication and authorization
 * - Activity logging for audit trails
 * - User management helpers
 * - Analytics queries
 * 
 * Security: All operations use the service role client to bypass RLS
 */

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

/**
 * Verify admin authentication
 * Returns admin email if authenticated, null otherwise
 */
export async function checkAdminAuth(userEmail?: string): Promise<{ 
  isAdmin: boolean; 
  email: string | null;
  error?: string;
}> {
  try {
    // If email is provided (from API route), use it
    if (userEmail) {
      const isAdmin = await isAdminUser(userEmail)
      return {
        isAdmin,
        email: isAdmin ? userEmail : null,
        error: isAdmin ? undefined : 'Unauthorized: Admin access required'
      }
    }

    // Otherwise, check auth from headers
    return {
      isAdmin: false,
      email: null,
      error: 'Unauthorized: No user email provided'
    }
  } catch (error) {
    return {
      isAdmin: false,
      email: null,
      error: 'Authentication check failed'
    }
  }
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

interface AdminActivityLog {
  admin_email: string
  action_type: string
  target_user_id?: string
  target_user_email?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminActivity(log: AdminActivityLog): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    
    const { error } = await supabase.from('admin_activity_logs').insert({
      admin_email: log.admin_email,
      action_type: log.action_type,
      target_user_id: log.target_user_id,
      target_user_email: log.target_user_email,
      details: log.details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
    })

    if (error) {
      // Fallback: use the SQL helper function (admin_activity_log table) if installed
      const { error: rpcError } = await supabase.rpc('log_admin_activity', {
        p_admin_email: log.admin_email,
        p_action_type: log.action_type,
        p_target_type: log.target_user_id ? 'user' : null,
        p_target_id: log.target_user_id ? log.target_user_id : null,
        p_details: {
          ...(log.details || {}),
          target_user_email: log.target_user_email || null,
        },
        p_ip_address: log.ip_address || null,
        p_user_agent: log.user_agent || null,
      })

      if (rpcError) {
        // Final fallback: insert directly into the legacy admin_activity_log table
        try {
          const { data: adminUser, error: adminUserError } = await supabase
            .from('admin_users')
            .select('id')
            .eq('email', log.admin_email)
            .single()

          if (adminUserError) {
            throw adminUserError
          }

          const { error: legacyInsertError } = await supabase.from('admin_activity_log').insert({
            admin_user_id: adminUser.id,
            action_type: log.action_type,
            target_type: log.target_user_id ? 'user' : null,
            target_id: log.target_user_id ? log.target_user_id : null,
            details: {
              ...(log.details || {}),
              target_user_email: log.target_user_email || null,
            },
            ip_address: log.ip_address,
            user_agent: log.user_agent,
          })

          if (legacyInsertError) {
            logger.error('admin_activity_log_error', { error, rpcError, legacyInsertError })
          }
        } catch (legacyError) {
          logger.error('admin_activity_log_error', { error, rpcError, legacyError })
        }
      }
    }
  } catch (error) {
    logger.error('admin_activity_log_error', { error })
  }
}

/**
 * Get admin activity logs with pagination
 */
export async function getAdminActivityLogs(params: {
  limit?: number
  offset?: number
  admin_email?: string
  action_type?: string
  target_user_id?: string
  search?: string
  start_date?: string
  end_date?: string
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      admin_email, 
      action_type, 
      target_user_id,
      search,
      start_date,
      end_date
    } = params

    try {
      let query = supabase
        .from('admin_activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (admin_email) {
        query = query.eq('admin_email', admin_email)
      }

      if (action_type) {
        query = query.eq('action_type', action_type)
      }

      if (target_user_id) {
        query = query.eq('target_user_id', target_user_id)
      }

      if (search) {
        query = query.or(`target_user_email.ilike.%${search}%,admin_email.ilike.%${search}%`)
      }

      if (start_date) {
        query = query.gte('created_at', start_date)
      }

      if (end_date) {
        query = query.lte('created_at', end_date)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        logs: data || [],
        total: count || 0,
        success: true,
      }
    } catch (error: any) {
      // Fallback: admin_activity_log schema (from SQL scripts)
      let query = supabase
        .from('admin_activity_log')
        .select(
          'id, action_type, target_type, target_id, details, ip_address, user_agent, created_at, admin_users(email)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (action_type) {
        query = query.eq('action_type', action_type)
      }

      if (target_user_id) {
        query = query.eq('target_id', target_user_id)
      }

      if (start_date) {
        query = query.gte('created_at', start_date)
      }

      if (end_date) {
        query = query.lte('created_at', end_date)
      }

      const { data, error: fallbackError, count } = await query

      if (fallbackError) {
        throw fallbackError
      }

      const logs = (data || []).map((row: any) => ({
        id: row.id,
        admin_email: row.admin_users?.email || '',
        action_type: row.action_type,
        target_user_id: row.target_id || null,
        target_user_email: row.details?.target_user_email || null,
        details: row.details || {},
        ip_address: row.ip_address || null,
        user_agent: row.user_agent || null,
        created_at: row.created_at,
      }))

      return {
        logs,
        total: count || 0,
        success: true,
      }
    }
  } catch (error: any) {
    logger.error('get_admin_activity_logs_error', { error })
    return {
      logs: [],
      total: 0,
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// USER MANAGEMENT HELPERS
// ============================================================================

/**
 * Get all users with comprehensive stats (uses admin_user_stats view)
 */
export async function getAllUsers(params: {
  limit?: number
  offset?: number
  subscription_status?: string
  activity_status?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      subscription_status, 
      activity_status, 
      search,
      sort_by = 'signup_date',
      sort_order = 'desc'
    } = params

    let query = supabase
      .from('admin_user_stats')
      .select('*', { count: 'exact' })

    // Apply filters
    if (subscription_status) {
      if (subscription_status === 'free') {
        query = query.or('subscription_status.is.null,subscription_status.eq.free')
      } else {
        query = query.eq('subscription_status', subscription_status)
      }
    }

    if (activity_status) {
      query = query.eq('activity_status', activity_status)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      users: data || [],
      total: count || 0,
      success: true,
    }
  } catch (error: any) {
    // Fallback when the admin_user_stats view isn't installed
    try {
      const supabase = createServiceRoleClient()
      const {
        limit = 50,
        offset = 0,
        subscription_status,
        activity_status,
        search,
        sort_by = 'signup_date',
        sort_order = 'desc',
      } = params

      let query = supabase
        .from('profiles')
        .select('id, email, full_name, subscription_status, created_at', { count: 'exact' })

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      }

      if (subscription_status) {
        if (subscription_status === 'free') {
          query = query.or('subscription_status.is.null,subscription_status.eq.free')
        } else {
          query = query.eq('subscription_status', subscription_status)
        }
      }

      const sortColumn = sort_by === 'signup_date' ? 'created_at' : sort_by
      query = query.order(sortColumn, { ascending: sort_order === 'asc' })
      query = query.range(offset, offset + limit - 1)

      const { data: profiles, error: profileError, count } = await query

      if (profileError) {
        throw profileError
      }

      const ids = (profiles || []).map((p) => p.id).filter(Boolean)

      // NOTE: This is a safe but potentially heavier fallback. It keeps the UI working
      // even if the admin_user_stats view isn't installed.
      const [reflectionRows, promptRows] = await Promise.all([
        ids.length
          ? supabase
              .from('reflections')
              .select('user_id, created_at')
              .in('user_id', ids)
              .order('created_at', { ascending: false })
              .limit(5000)
          : Promise.resolve({ data: [] as any[] }),
        ids.length
          ? supabase
              .from('prompts_history')
              .select('user_id, created_at')
              .in('user_id', ids)
              .order('created_at', { ascending: false })
              .limit(5000)
          : Promise.resolve({ data: [] as any[] }),
      ])

      const reflectionsByUser = new Map<string, { count: number; last: string | null }>()
      for (const row of reflectionRows.data || []) {
        const existing = reflectionsByUser.get(row.user_id) || { count: 0, last: null }
        reflectionsByUser.set(row.user_id, {
          count: existing.count + 1,
          last: existing.last || row.created_at,
        })
      }

      const promptsByUser = new Map<string, number>()
      for (const row of promptRows.data || []) {
        promptsByUser.set(row.user_id, (promptsByUser.get(row.user_id) || 0) + 1)
      }

      const now = Date.now()
      const users = (profiles || []).map((p) => {
        const reflection = reflectionsByUser.get(p.id) || { count: 0, last: null }
        const promptCount = promptsByUser.get(p.id) || 0

        let activity: string = 'dormant'
        if (reflection.last) {
          const lastMs = new Date(reflection.last).getTime()
          const days = (now - lastMs) / (1000 * 60 * 60 * 24)
          if (days <= 7) activity = 'active'
          else if (days <= 30) activity = 'moderate'
          else if (days <= 90) activity = 'inactive'
          else activity = 'dormant'
        } else {
          activity = 'dormant'
        }

        const engagement = promptCount > 0 ? (reflection.count / promptCount) * 100 : 0

        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          subscription_status: p.subscription_status,
          signup_date: p.created_at,
          total_reflections: reflection.count,
          engagement_rate_percent: Math.round(engagement * 10) / 10,
          activity_status: activity,
          last_reflection_date: reflection.last,
        }
      })

      const filteredUsers = activity_status ? users.filter((u) => u.activity_status === activity_status) : users

      return {
        users: filteredUsers,
        total: activity_status ? filteredUsers.length : count || 0,
        success: true,
      }
    } catch (fallbackError: any) {
      logger.error('get_all_users_error', { error, fallbackError })
      return {
        users: [],
        total: 0,
        success: false,
        error: error.message,
      }
    }
  }
}

/**
 * Get single user details (non-sensitive data only)
 */
export async function getUserById(userId: string) {
  try {
    const supabase = createServiceRoleClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, timezone, language, subscription_status, billing_cycle, stripe_customer_id, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw profileError
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get prompt stats (counts only, no content)
    const { count: promptCount } = await supabase
      .from('prompts_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { count: reflectionCount } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      user: {
        ...profile,
        preferences,
        stats: {
          total_prompts: promptCount || 0,
          total_reflections: reflectionCount || 0,
        }
      },
      success: true,
    }
  } catch (error: any) {
    return {
      user: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update user profile (non-sensitive fields only)
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string
    email?: string
    timezone?: string
    language?: string
  },
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()

    // Get current user email for logging
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log the activity
    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'user_updated',
      target_user_id: userId,
      target_user_email: currentUser?.email,
      details: { updates },
    })

    return {
      user: data,
      success: true,
    }
  } catch (error: any) {
    logger.error('update_user_error', { error, userId, updates })
    return {
      user: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string, adminEmail: string) {
  try {
    const supabase = createServiceRoleClient()

    // Get user email before deletion for logging
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    // Delete from auth.users (will cascade to profiles and related tables)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      throw authError
    }

    // Log the activity
    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'user_deleted',
      target_user_id: userId,
      target_user_email: user?.email,
      details: { reason: 'Admin deletion' },
    })

    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error: any) {
    logger.error('delete_user_error', { error, userId })
    return {
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get dashboard overview stats
 */
export async function getDashboardStats() {
  try {
    const supabase = createServiceRoleClient()

    const daysBack = 30
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    const cutoffDateISO = cutoffDate.toISOString()
    const cutoffDateStr = cutoffDateISO.split('T')[0]

    // Total users (always from live table)
    const { count: totalUsersCount, error: totalUsersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (totalUsersError) throw totalUsersError

    const totalUsers = totalUsersCount || 0

    // Get MRR and user counts
    let mrr = 0
    let monthly_subs = 0
    let annual_subs = 0
    let free_users = 0

    try {
      const { data: mrrData, error: mrrError } = await supabase.rpc('calculate_mrr')
      if (mrrError) throw mrrError

      const row = mrrData?.[0] || {}
      mrr = Number((row as any).total_mrr) || 0
      monthly_subs = Number((row as any).monthly_subs) || 0
      annual_subs = Number((row as any).annual_subs) || 0
      free_users = Number((row as any).free_users) || 0
    } catch (error: any) {
      // Fallback: compute from live profiles table
      const [monthlyCount, annualCount] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('subscription_status', 'premium')
          .eq('billing_cycle', 'monthly'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('subscription_status', 'premium')
          .eq('billing_cycle', 'yearly'),
      ])

      if (monthlyCount.error) throw monthlyCount.error
      if (annualCount.error) throw annualCount.error

      monthly_subs = monthlyCount.count || 0
      annual_subs = annualCount.count || 0
      free_users = Math.max(0, totalUsers - monthly_subs - annual_subs)

      // Keep same pricing assumptions as the SQL helper
      mrr = monthly_subs * 12.0 + annual_subs * 8.25

      logger.warn('calculate_mrr_rpc_unavailable_using_fallback', {
        error: error?.message,
      })
    }

    // Get engagement stats
    let total_prompts_sent = 0
    let total_reflections = 0
    let engagement_rate = 0

    try {
      const { data: engagementData, error: engagementError } = await supabase.rpc('get_engagement_stats', { days_back: daysBack })
      if (engagementError) throw engagementError

      const row = engagementData?.[0] || {}
      total_prompts_sent = Number((row as any).total_prompts_sent) || 0
      total_reflections = Number((row as any).total_reflections) || 0
      engagement_rate = Number((row as any).overall_engagement_rate) || 0
    } catch (error: any) {
      // Fallback: compute from live tables
      // NOTE: prompts are stored in prompts_history (not prompts)
      const [promptCount, reflectionCount] = await Promise.all([
        supabase
          .from('prompts_history')
          .select('id', { count: 'exact', head: true })
          .gte('date_generated', cutoffDateStr),
        supabase
          .from('reflections')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', cutoffDateISO),
      ])

      if (promptCount.error) throw promptCount.error
      if (reflectionCount.error) throw reflectionCount.error

      total_prompts_sent = promptCount.count || 0
      total_reflections = reflectionCount.count || 0
      engagement_rate = total_prompts_sent > 0
        ? Math.round((total_reflections / total_prompts_sent) * 1000) / 10
        : 0

      logger.warn('get_engagement_stats_rpc_unavailable_using_fallback', {
        error: error?.message,
      })
    }

    // Get new signups in last 30 days
    const { count: newSignups } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffDateISO)

    return {
      stats: {
        mrr,
        total_users: totalUsers,
        free_users,
        premium_users: monthly_subs + annual_subs,
        monthly_subs,
        annual_subs,
        engagement_rate,
        total_prompts_sent,
        total_reflections,
        new_signups_30d: newSignups || 0,
      },
      success: true,
    }
  } catch (error: any) {
    logger.error('get_dashboard_stats_error', { error })
    return {
      stats: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(limit: number = 20) {
  try {
    const supabase = createServiceRoleClient()

    // Get recent signups
    const { data: signups } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent subscription events
    const { data: subscriptionEvents } = await supabase
      .from('subscription_events')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(10)

    // Combine and sort by date
    const activities = [
      ...(signups || []).map(s => ({
        type: 'signup' as const,
        user_email: s.email,
        user_name: s.full_name,
        timestamp: s.created_at,
        details: { subscription_status: s.subscription_status }
      })),
      ...(subscriptionEvents || []).map(e => ({
        type: 'subscription' as const,
        user_email: (e.profiles as any)?.email,
        user_name: (e.profiles as any)?.full_name,
        timestamp: e.created_at,
        details: { event_type: e.event_type, old_status: e.old_status, new_status: e.new_status }
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return {
      activities,
      success: true,
    }
  } catch (error: any) {
    logger.error('get_recent_activity_error', { error })
    return {
      activities: [],
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get engagement trends over time
 */
export async function getEngagementTrends(days: number = 30) {
  try {
    const supabase = createServiceRoleClient()
    
    // Get daily engagement data
    const { data, error } = await supabase.rpc('get_daily_engagement', { days_back: days })
    
    if (error) throw error
    
    return {
      trends: data || [],
      success: true
    }
  } catch (error: any) {
    return {
      trends: [],
      success: false,
      error: error.message
    }
  }
}

/**
 * Get revenue breakdown
 */
export async function getRevenueBreakdown() {
  try {
    const supabase = createServiceRoleClient()
    
    // Get MRR data
    const { data: mrrData } = await supabase.rpc('calculate_mrr')
    const mrr = mrrData?.[0] || { total_mrr: 0, monthly_subs: 0, annual_subs: 0, free_users: 0 }
    
    // Get subscription growth over time (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: growthData, error: growthError } = await supabase
      .from('subscription_events')
      .select('created_at, event_type, new_status')
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: true })
    
    if (growthError) throw growthError
    
    return {
      mrr,
      growth: growthData || [],
      success: true
    }
  } catch (error: any) {
    return {
      mrr: null,
      growth: [],
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get all subscriptions with user details
 */
export async function getAllSubscriptions(params: {
  limit?: number
  offset?: number
  subscription_status?: string
  billing_cycle?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      subscription_status, 
      billing_cycle,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = params

    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        subscription_status,
        subscription_id,
        stripe_customer_id,
        billing_cycle,
        subscription_end_date,
        created_at,
        updated_at
      `, { count: 'exact' })

    // Apply filters
    if (subscription_status) {
      if (subscription_status === 'free') {
        query = query.or('subscription_status.is.null,subscription_status.eq.free')
      } else {
        query = query.eq('subscription_status', subscription_status)
      }
    }

    if (billing_cycle) {
      query = query.eq('billing_cycle', billing_cycle)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const subscriptions = (data || []).map((row: any) => ({
      ...row,
      subscription_status: row.subscription_status || 'free',
    }))

    return {
      subscriptions,
      total: count || 0,
      success: true,
    }
  } catch (error: any) {
    return {
      subscriptions: [],
      total: 0,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get single subscription details with events history
 */
export async function getSubscriptionById(userId: string) {
  try {
    const supabase = createServiceRoleClient()

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        subscription_status,
        subscription_id,
        stripe_customer_id,
        billing_cycle,
        subscription_end_date,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single()

    if (subError) throw subError

    // Get subscription events history
    const { data: events, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (eventsError) throw eventsError

    return {
      subscription,
      events: events || [],
      success: true,
    }
  } catch (error: any) {
    return {
      subscription: null,
      events: [],
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update subscription status
 */
export async function updateSubscription(
  userId: string,
  updates: {
    subscription_status?: string
    billing_cycle?: string
    subscription_end_date?: string | null
  },
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()
    // Get current subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from('profiles')
      .select('subscription_status, email, billing_cycle, subscription_end_date')
      .eq('id', userId)
      .single()

    if (fetchError) {
      throw fetchError
    }
    // Update subscription
    const { data: updatedData, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (updateError) {
      throw updateError
    }
    // Log subscription event if status changed
    if (updates.subscription_status && currentSub?.subscription_status !== updates.subscription_status) {
      await supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          event_type: 'admin_update',
          old_status: currentSub.subscription_status,
          new_status: updates.subscription_status,
          metadata: { updated_by: adminEmail },
        })
    }

    // Log admin activity
    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'subscription_update',
      target_user_id: userId,
      target_user_email: currentSub?.email,
      details: { updates },
    })

    return {
      success: true,
    }
  } catch (error: any) {
    logger.error('update_subscription_error', { error, userId, updates })
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(userId: string, adminEmail: string, reason?: string) {
  try {
    const supabase = createServiceRoleClient()

    // Get current subscription
    const { data: currentSub } = await supabase
      .from('profiles')
      .select('subscription_status, email, stripe_customer_id, subscription_id')
      .eq('id', userId)
      .single()

    if (!currentSub) {
      throw new Error('Subscription not found')
    }

    // Update subscription to cancelled
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Log subscription event
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'cancelled',
        old_status: currentSub.subscription_status,
        new_status: 'cancelled',
        metadata: { 
          cancelled_by: adminEmail,
          reason: reason || 'Admin cancellation',
        },
      })

    // Log admin activity
    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'subscription_cancel',
      target_user_id: userId,
      target_user_email: currentSub.email,
      details: { reason },
    })

    return {
      success: true,
    }
  } catch (error: any) {
    logger.error('cancel_subscription_error', { error, userId })
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get subscription stats for dashboard
 */
export async function getSubscriptionStats() {
  try {
    const supabase = createServiceRoleClient()

    // Get counts by status
    const { data: stats } = await supabase
      .from('profiles')
      .select('subscription_status, billing_cycle')

    const statusCounts = {
      freemium: 0,
      premium: 0,
      cancelled: 0,
      total: stats?.length || 0,
      monthly_subs: 0,
      annual_subs: 0,
    }

    stats?.forEach(s => {
      // Count free users (null, 'free', or 'cancelled' status)
      if (!s.subscription_status || s.subscription_status === 'free' || s.subscription_status === 'cancelled') {
        statusCounts.freemium++
      }
      // Count premium users
      if (s.subscription_status === 'premium') {
        statusCounts.premium++
        if (s.billing_cycle === 'monthly') statusCounts.monthly_subs++
        if (s.billing_cycle === 'yearly') statusCounts.annual_subs++
      }
      // Count cancelled separately
      if (s.subscription_status === 'cancelled') {
        statusCounts.cancelled++
      }
    })

    // Get MRR
    const { data: mrrData } = await supabase.rpc('calculate_mrr')
    const mrr = mrrData?.[0]?.total_mrr || 0

    // Get recent cancellations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentCancellations } = await supabase
      .from('subscription_events')
      .select('id')
      .eq('event_type', 'cancelled')
      .gte('created_at', thirtyDaysAgo)

    // Get pricing info from system_settings
    const { data: priceSettings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['monthly_price', 'yearly_price', 'currency'])

    const monthlyPrice = priceSettings?.find(s => s.key === 'monthly_price')?.value || 12.00
    const yearlyPrice = priceSettings?.find(s => s.key === 'yearly_price')?.value || 99.00
    const currency = priceSettings?.find(s => s.key === 'currency')?.value || 'GBP'

    return {
      stats: {
        ...statusCounts,
        mrr,
        recent_cancellations: recentCancellations?.length || 0,
        pricing: {
          monthly: monthlyPrice,
          yearly: yearlyPrice,
          currency: currency,
        },
      },
      success: true,
    }
  } catch (error: any) {
    logger.error('get_subscription_stats_error', { error })
    return {
      stats: null,
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// CRON JOB MONITORING
// ============================================================================

/**
 * Get cron job runs with filtering and pagination
 */
export async function getCronJobRuns(params: {
  limit?: number
  offset?: number
  job_name?: string
  status?: string
  start_date?: string
  end_date?: string
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      job_name,
      status,
      start_date,
      end_date
    } = params

    let query = supabase
      .from('cron_job_runs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (job_name) {
      query = query.eq('job_name', job_name)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (start_date) {
      query = query.gte('started_at', start_date)
    }

    if (end_date) {
      query = query.lte('started_at', end_date)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      runs: data || [],
      total: count || 0,
      success: true,
    }
  } catch (error: any) {
    logger.error('get_cron_runs_error', { error })
    return {
      runs: [],
      total: 0,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get cron job statistics
 */
export async function getCronJobStats() {
  try {
    const supabase = createServiceRoleClient()

    // Get all runs
    const { data: allRuns } = await supabase
      .from('cron_job_runs')
      .select('status, duration_ms')

    const total = allRuns?.length || 0
    const successful = allRuns?.filter(r => r.status === 'success').length || 0
    const failed = allRuns?.filter(r => r.status === 'failed').length || 0
    const successRate = total > 0 ? (successful / total) * 100 : 0
    const avgDuration = allRuns && allRuns.length > 0
      ? allRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / allRuns.length
      : 0

    // Get runs in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentRuns } = await supabase
      .from('cron_job_runs')
      .select('status')
      .gte('started_at', twentyFourHoursAgo)

    const recentTotal = recentRuns?.length || 0
    const recentSuccessful = recentRuns?.filter(r => r.status === 'success').length || 0
    const recentFailed = recentRuns?.filter(r => r.status === 'failed').length || 0

    return {
      stats: {
        total_runs: total,
        successful_runs: successful,
        failed_runs: failed,
        success_rate: successRate,
        avg_duration_ms: avgDuration,
        recent_24h: {
          total: recentTotal,
          successful: recentSuccessful,
          failed: recentFailed,
        },
      },
      success: true,
    }
  } catch (error: any) {
    logger.error('get_cron_stats_error', { error })
    return {
      stats: null,
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// EMAIL TRACKING
// ============================================================================

/**
 * Get email logs with filtering and pagination
 */
export async function getEmailLogs(params: {
  limit?: number
  offset?: number
  recipient_email?: string
  template_name?: string
  status?: string
  start_date?: string
  end_date?: string
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      recipient_email,
      template_name,
      status,
      start_date,
      end_date
    } = params

    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (recipient_email) {
      query = query.ilike('recipient_email', `%${recipient_email}%`)
    }

    if (template_name) {
      query = query.eq('template_name', template_name)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (start_date) {
      query = query.gte('sent_at', start_date)
    }

    if (end_date) {
      query = query.lte('sent_at', end_date)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      logs: data || [],
      total: count || 0,
      success: true,
    }
  } catch (error: any) {
    logger.error('get_email_logs_error', { error })
    return {
      logs: [],
      total: 0,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get email statistics
 */
export async function getEmailStats() {
  try {
    const supabase = createServiceRoleClient()

    // Get stats using the helper function
    try {
      const { data: stats, error } = await supabase.rpc('get_email_stats')
      if (error) throw error

      const row = stats?.[0] || {}

      return {
        stats: {
          total_sent: Number(row.total_sent) || 0,
          total_delivered: Number(row.total_delivered) || 0,
          total_bounced: Number(row.total_bounced) || 0,
          total_opened: Number(row.total_opened) || 0,
          delivery_rate: Number(row.delivery_rate) || 0,
          open_rate: Number(row.open_rate) || 0,
          bounce_rate: Number(row.bounce_rate) || 0,
        },
        success: true,
      }
    } catch (error: any) {
      // Fallback: compute from live email_logs when the RPC isn't installed yet
      const [
        sentCount,
        deliveredCount,
        bouncedCount,
        openedCount,
      ] = await Promise.all([
        supabase.from('email_logs').select('id', { count: 'exact', head: true }),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).in('status', ['delivered', 'opened', 'clicked']),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'bounced'),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).in('status', ['opened', 'clicked']),
      ])

      if (sentCount.error) throw sentCount.error
      if (deliveredCount.error) throw deliveredCount.error
      if (bouncedCount.error) throw bouncedCount.error
      if (openedCount.error) throw openedCount.error

      const total_sent = sentCount.count || 0
      const total_delivered = deliveredCount.count || 0
      const total_bounced = bouncedCount.count || 0
      const total_opened = openedCount.count || 0

      const delivery_rate = total_sent > 0 ? Math.round((total_delivered / total_sent) * 1000) / 10 : 0
      const open_rate = total_delivered > 0 ? Math.round((total_opened / total_delivered) * 1000) / 10 : 0
      const bounce_rate = total_sent > 0 ? Math.round((total_bounced / total_sent) * 1000) / 10 : 0

      logger.warn('get_email_stats_rpc_unavailable_using_fallback', {
        error: error?.message,
      })

      return {
        stats: {
          total_sent,
          total_delivered,
          total_bounced,
          total_opened,
          delivery_rate,
          open_rate,
          bounce_rate,
        },
        success: true,
      }
    }
  } catch (error: any) {
    logger.error('get_email_stats_error', { error })
    return {
      stats: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all email templates
 */
export async function getEmailTemplates() {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return {
      templates: data || [],
      success: true,
    }
  } catch (error: any) {
    return {
      templates: [],
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get single email template by ID
 */
export async function getEmailTemplateById(templateId: string) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) throw error

    return {
      template: data,
      success: true,
    }
  } catch (error: any) {
    logger.error('get_email_template_error', { error, templateId })
    return {
      template: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update email template
 */
export async function updateEmailTemplate(
  templateId: string,
  updates: {
    name?: string
    subject?: string
    html_content?: string
    text_content?: string
    is_active?: boolean
  },
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error

    // Log the activity
    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'email_template_updated',
      details: { template_id: templateId, updates },
    })

    return {
      template: data,
      success: true,
    }
  } catch (error: any) {
    logger.error('update_email_template_error', { error, templateId, updates })
    return {
      template: null,
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// SUPPORT TICKETS
// ============================================================================

/**
 * Get support tickets with filtering and pagination
 */
export async function getSupportTickets(params: {
  limit?: number
  offset?: number
  status?: string
  priority?: string
  search?: string
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      status,
      priority,
      search
    } = params

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        profiles(email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      tickets: data || [],
      total: count || 0,
      success: true,
    }
  } catch (error: any) {
    logger.error('get_support_tickets_error', { error })
    return {
      tickets: [],
      total: 0,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get single support ticket with responses
 */
export async function getSupportTicketById(ticketId: string) {
  try {
    const supabase = createServiceRoleClient()

    // Get ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles(email, full_name)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError) throw ticketError

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from('support_responses')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (responsesError) throw responsesError

    return {
      ticket,
      responses: responses || [],
      success: true,
    }
  } catch (error: any) {
    logger.error('get_support_ticket_error', { error, ticketId })
    return {
      ticket: null,
      responses: [],
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get support ticket statistics
 */
export async function getSupportStats() {
  try {
    const supabase = createServiceRoleClient()

    // Get stats using the helper function
    const { data: stats, error } = await supabase.rpc('get_support_stats')

    if (error) throw error

    return {
      stats: stats?.[0] || {
        total_tickets: 0,
        open_tickets: 0,
        in_progress_tickets: 0,
        resolved_tickets: 0,
        avg_response_time_hours: 0
      },
      success: true,
    }
  } catch (error: any) {
    return {
      stats: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update support ticket status
 */
export async function updateSupportTicket(
  ticketId: string,
  updates: {
    status?: string
    priority?: string
    assigned_to?: string
  },
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error

    // Log the activity
    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'support_ticket_updated',
      details: { ticket_id: ticketId, updates },
    })

    return {
      ticket: data,
      success: true,
    }
  } catch (error: any) {
    logger.error('update_support_ticket_error', { error, ticketId, updates })
    return {
      ticket: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Add response to support ticket
 */
export async function addSupportResponse(
  ticketId: string,
  message: string,
  adminEmail: string,
  isInternal: boolean = false
) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('support_responses')
      .insert({
        ticket_id: ticketId,
        responder_email: adminEmail,
        message,
        is_internal: isInternal,
      })
      .select()
      .single()

    if (error) throw error

    // Update ticket's updated_at timestamp
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    // Log the activity
    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'support_response_added',
      details: { ticket_id: ticketId, is_internal: isInternal },
    })

    return {
      response: data,
      success: true,
    }
  } catch (error: any) {
    logger.error('add_support_response_error', { error, ticketId })
    return {
      response: null,
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// PROMPT LIBRARY
// ============================================================================

/**
 * Get prompt library items with filtering and pagination
 */
export async function getPromptLibrary(params: {
  limit?: number
  offset?: number
  category?: string
  search?: string
  is_active?: boolean
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      category,
      search,
      is_active
    } = params

    let query = supabase
      .from('prompt_library')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,tags.cs.{${search}}`)
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      prompts: data || [],
      total: count || 0,
      success: true,
    }
  } catch (error: any) {
    return {
      prompts: [],
      total: 0,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get single prompt from library
 */
export async function getPromptById(promptId: string) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('prompt_library')
      .select('*')
      .eq('id', promptId)
      .single()

    if (error) throw error

    return {
      prompt: data,
      success: true,
    }
  } catch (error: any) {
    return {
      prompt: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create new prompt in library
 */
export async function createPrompt(
  promptData: {
    title: string
    content: string
    category: string
    tags?: string[]
    is_active?: boolean
  },
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('prompt_library')
      .insert({
        ...promptData,
        created_by: adminEmail,
      })
      .select()
      .single()

    if (error) throw error

    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'prompt_created',
      details: { prompt_id: data.id, title: promptData.title },
    })

    return {
      prompt: data,
      success: true,
    }
  } catch (error: any) {
    return {
      prompt: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update prompt in library
 */
export async function updatePrompt(
  promptId: string,
  updates: {
    title?: string
    content?: string
    category?: string
    tags?: string[]
    is_active?: boolean
  },
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('prompt_library')
      .update(updates)
      .eq('id', promptId)
      .select()
      .single()

    if (error) throw error

    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'prompt_updated',
      details: { prompt_id: promptId, updates },
    })

    return {
      prompt: data,
      success: true,
    }
  } catch (error: any) {
    return {
      prompt: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete prompt from library
 */
export async function deletePrompt(promptId: string, adminEmail: string) {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('prompt_library')
      .delete()
      .eq('id', promptId)

    if (error) throw error

    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'prompt_deleted',
      details: { prompt_id: promptId },
    })

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

/**
 * Get all system settings
 */
export async function getSystemSettings() {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })

    if (error) throw error

    return {
      settings: data || [],
      success: true,
    }
  } catch (error: any) {
    return {
      settings: [],
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update system setting
 */
export async function updateSystemSetting(
  key: string,
  value: any,
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('system_settings')
      .update({ 
        value,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select()
      .single()

    if (error) throw error

    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'setting_updated',
      details: { key, value },
    })

    return {
      setting: data,
      success: true,
    }
  } catch (error: any) {
    return {
      setting: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all feature flags
 */
export async function getFeatureFlags() {
  try {
    const supabase = createServiceRoleClient()

    // Support multiple schema variants:
    // - Variant A: key/name/enabled
    // - Variant B: name/is_enabled (+ rollout fields)
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      return {
        flags: data || [],
        success: true,
      }
    } catch (_e) {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('key', { ascending: true })

      if (error) throw error

      return {
        flags: data || [],
        success: true,
      }
    }
  } catch (error: any) {
    return {
      flags: [],
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update feature flag
 */
export async function updateFeatureFlag(
  key: string,
  enabled: boolean,
  adminEmail: string
) {
  try {
    const supabase = createServiceRoleClient()

    // Support multiple schema variants:
    // - Variant A: key + enabled
    // - Variant B: name + is_enabled
    let data: any = null
    try {
      const result = await supabase
        .from('feature_flags')
        .update({
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)
        .select()
        .single()

      if (result.error) throw result.error
      data = result.data
    } catch (_e) {
      const result = await supabase
        .from('feature_flags')
        .update({
          is_enabled: enabled,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('name', key)
        .select()
        .single()

      if (result.error) throw result.error
      data = result.data
    }

    await logAdminActivity({
      admin_email: adminEmail,
      action_type: 'feature_flag_updated',
      details: { key, enabled },
    })

    return {
      flag: data,
      success: true,
    }
  } catch (error: any) {
    return {
      flag: null,
      success: false,
      error: error.message,
    }
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Export users to CSV format
 */
export function usersToCSV(users: any[]): string {
  const headers = [
    'Email',
    'Full Name',
    'Subscription Status',
    'Signup Date',
    'Total Reflections',
    'Engagement Rate',
    'Activity Status',
    'Last Active',
  ]

  const rows = users.map(user => [
    user.email || '',
    user.full_name || '',
    user.subscription_status || '',
    user.signup_date || '',
    user.total_reflections || 0,
    `${user.engagement_rate_percent || 0}%`,
    user.activity_status || '',
    user.last_reflection_date || 'Never',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}
