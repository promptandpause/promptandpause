/**
 * Maintenance Service
 * 
 * Manages scheduled maintenance windows, sends batch notifications,
 * and controls global maintenance mode.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { sendMaintenanceStartEmail, sendMaintenanceCompleteEmail } from '@/lib/services/emailService'
import {
  MaintenanceWindow,
  MaintenanceNotification,
  MaintenanceMode,
  MaintenanceWindowWithNotifications,
  CreateMaintenanceWindowDTO,
  UpdateMaintenanceWindowDTO,
  SendMaintenanceNotificationDTO,
  SetMaintenanceModeDTO,
  MaintenanceServiceResponse,
  BatchSendResult,
  MaintenanceStatus,
  isWeekend,
} from '@/lib/types/maintenance'

// Batch configuration
const BATCH_SIZE = 100
const BATCH_DELAY_MS = 1000 // 1 second delay between batches

// =============================================================================
// MAINTENANCE WINDOW CRUD
// =============================================================================

/**
 * Get all maintenance windows, optionally filtered by status
 */
export async function getAllMaintenanceWindows(
  status?: MaintenanceStatus
): Promise<MaintenanceServiceResponse<MaintenanceWindow[]>> {
  try {
    const supabase = createServiceRoleClient()

    let query = supabase
      .from('maintenance_windows')
      .select('*')
      .order('scheduled_date', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      logger.error('maintenance_windows_fetch_error', { error, status })
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    logger.error('maintenance_windows_unexpected_error', { error, status })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a single maintenance window by ID
 */
export async function getMaintenanceWindow(
  id: string
): Promise<MaintenanceServiceResponse<MaintenanceWindowWithNotifications>> {
  try {
    const supabase = createServiceRoleClient()

    const { data: window, error: windowError } = await supabase
      .from('maintenance_windows')
      .select('*')
      .eq('id', id)
      .single()

    if (windowError) {
      logger.error('maintenance_window_fetch_error', { error: windowError, id })
      return { success: false, error: windowError.message }
    }

    // Fetch notifications for this window
    const { data: notifications } = await supabase
      .from('maintenance_notifications')
      .select('*')
      .eq('maintenance_window_id', id)
      .order('sent_at', { ascending: false })

    return {
      success: true,
      data: { ...window, notifications: notifications || [] },
    }
  } catch (error) {
    logger.error('maintenance_window_unexpected_error', { error, id })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create a new maintenance window (weekend validation enforced)
 */
export async function createMaintenanceWindow(
  data: CreateMaintenanceWindowDTO
): Promise<MaintenanceServiceResponse<MaintenanceWindow>> {
  try {
    // Client-side weekend validation (database also enforces this)
    if (!isWeekend(data.scheduled_date)) {
      return {
        success: false,
        error: 'Maintenance can only be scheduled on weekends (Saturday or Sunday)',
      }
    }

    // Validate time range
    if (data.end_time <= data.start_time) {
      return {
        success: false,
        error: 'End time must be after start time',
      }
    }

    const supabase = createServiceRoleClient()

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .insert({
        scheduled_date: data.scheduled_date,
        start_time: data.start_time,
        end_time: data.end_time,
        affected_services: data.affected_services,
        description: data.description || null,
        created_by: data.created_by,
        status: 'scheduled',
      })
      .select()
      .single()

    if (error) {
      logger.error('maintenance_window_create_error', { error, data })
      return { success: false, error: error.message }
    }

    logger.info('maintenance_window_created', { windowId: window.id, scheduledDate: data.scheduled_date })
    return { success: true, data: window }
  } catch (error) {
    logger.error('maintenance_window_create_unexpected_error', { error, data })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update a maintenance window
 */
export async function updateMaintenanceWindow(
  id: string,
  data: UpdateMaintenanceWindowDTO
): Promise<MaintenanceServiceResponse<MaintenanceWindow>> {
  try {
    // Weekend validation if date is being updated
    if (data.scheduled_date && !isWeekend(data.scheduled_date)) {
      return {
        success: false,
        error: 'Maintenance can only be scheduled on weekends (Saturday or Sunday)',
      }
    }

    // Time range validation if times are being updated
    if (data.start_time && data.end_time && data.end_time <= data.start_time) {
      return {
        success: false,
        error: 'End time must be after start time',
      }
    }

    const supabase = createServiceRoleClient()

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('maintenance_window_update_error', { error, id, data })
      return { success: false, error: error.message }
    }

    logger.info('maintenance_window_updated', { windowId: id })
    return { success: true, data: window }
  } catch (error) {
    logger.error('maintenance_window_update_unexpected_error', { error, id, data })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Cancel a maintenance window
 */
export async function cancelMaintenanceWindow(
  id: string
): Promise<MaintenanceServiceResponse<MaintenanceWindow>> {
  return updateMaintenanceWindow(id, {
    status: 'cancelled',
    notes: 'Maintenance window cancelled',
  })
}

// =============================================================================
// NOTIFICATION SENDING
// =============================================================================

/**
 * Send maintenance start notifications to all active users
 */
export async function sendMaintenanceStartNotifications(
  windowId: string,
  sentBy: string
): Promise<MaintenanceServiceResponse<BatchSendResult>> {
  try {
    const supabase = createServiceRoleClient()

    // Get maintenance window details
    const { data: window, error: windowError } = await supabase
      .from('maintenance_windows')
      .select('*')
      .eq('id', windowId)
      .single()

    if (windowError) {
      return { success: false, error: windowError.message }
    }

    if (window.notification_sent) {
      return { success: false, error: 'Notifications already sent for this window' }
    }

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, preferred_name, email_preferences')
      .eq('is_active', true)

    if (usersError) {
      logger.error('users_fetch_error', { error: usersError })
      return { success: false, error: usersError.message }
    }

    // Filter users who haven't opted out of system notifications
    const eligibleUsers = users.filter((user: any) => {
      const prefs = user.email_preferences || {}
      return prefs.system_notifications !== false
    })

    logger.info('maintenance_notification_start', {
      windowId,
      totalUsers: users.length,
      eligibleUsers: eligibleUsers.length,
    })

    // Send emails in batches
    const result = await sendBatchEmails(
      eligibleUsers,
      async (user: any) => {
        return await sendMaintenanceStartEmail(user.email, user.preferred_name, {
          scheduledDate: window.scheduled_date,
          startTime: window.start_time,
          endTime: window.end_time,
          affectedServices: window.affected_services,
          description: window.description || undefined,
        })
      }
    )

    // Update window as notified
    await supabase
      .from('maintenance_windows')
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
      })
      .eq('id', windowId)

    // Log notification batch
    await supabase.from('maintenance_notifications').insert({
      maintenance_window_id: windowId,
      notification_type: 'planned',
      recipient_count: result.successful_sends,
      sent_by: sentBy,
      batch_details: {
        total_recipients: result.total_recipients,
        successful_sends: result.successful_sends,
        failed_sends: result.failed_sends,
        error_count: result.errors.length,
      },
    })

    logger.info('maintenance_notification_complete', { windowId, result })
    return { success: true, data: result }
  } catch (error) {
    logger.error('maintenance_notification_unexpected_error', { error, windowId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send maintenance completion notifications to all active users
 */
export async function sendMaintenanceCompleteNotifications(
  windowId: string,
  sentBy: string,
  options?: { notes?: string; improvements?: string }
): Promise<MaintenanceServiceResponse<BatchSendResult>> {
  try {
    const supabase = createServiceRoleClient()

    // Get maintenance window details
    const { data: window, error: windowError } = await supabase
      .from('maintenance_windows')
      .select('*')
      .eq('id', windowId)
      .single()

    if (windowError) {
      return { success: false, error: windowError.message }
    }

    if (window.completion_notification_sent) {
      return { success: false, error: 'Completion notifications already sent for this window' }
    }

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, preferred_name, email_preferences')
      .eq('is_active', true)

    if (usersError) {
      logger.error('users_fetch_error', { error: usersError })
      return { success: false, error: usersError.message }
    }

    // Filter users who haven't opted out
    const eligibleUsers = users.filter((user: any) => {
      const prefs = user.email_preferences || {}
      return prefs.system_notifications !== false
    })

    logger.info('maintenance_completion_notification_start', {
      windowId,
      totalUsers: users.length,
      eligibleUsers: eligibleUsers.length,
    })

    // Send emails in batches
    const result = await sendBatchEmails(
      eligibleUsers,
      async (user: any) => {
        return await sendMaintenanceCompleteEmail(user.email, user.preferred_name, {
          completedAt: new Date().toISOString(),
          improvements: options?.improvements,
          notes: options?.notes,
        })
      }
    )

    // Update window status
    await supabase
      .from('maintenance_windows')
      .update({
        status: 'completed',
        completion_notification_sent: true,
        completion_notification_sent_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        notes: options?.notes || window.notes,
      })
      .eq('id', windowId)

    // Log notification batch
    await supabase.from('maintenance_notifications').insert({
      maintenance_window_id: windowId,
      notification_type: 'completed',
      recipient_count: result.successful_sends,
      sent_by: sentBy,
      batch_details: {
        total_recipients: result.total_recipients,
        successful_sends: result.successful_sends,
        failed_sends: result.failed_sends,
        error_count: result.errors.length,
      },
    })

    logger.info('maintenance_completion_notification_complete', { windowId, result })
    return { success: true, data: result }
  } catch (error) {
    logger.error('maintenance_completion_notification_unexpected_error', { error, windowId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Helper function to send emails in batches with retry logic
 */
async function sendBatchEmails(
  users: any[],
  sendEmail: (user: any) => Promise<{ success: boolean; emailId?: string; error?: string }>
): Promise<BatchSendResult> {
  const result: BatchSendResult = {
    total_recipients: users.length,
    successful_sends: 0,
    failed_sends: 0,
    errors: [],
  }

  // Process in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE)

    // Send emails concurrently within batch
    const promises = batch.map(async (user) => {
      try {
        const sendResult = await sendEmail(user)
        if (sendResult.success) {
          result.successful_sends++
        } else {
          result.failed_sends++
          result.errors.push({
            email: user.email,
            error: sendResult.error || 'Unknown error',
          })
        }
      } catch (error) {
        result.failed_sends++
        result.errors.push({
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    await Promise.all(promises)

    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < users.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  return result
}

// =============================================================================
// MAINTENANCE MODE
// =============================================================================

/**
 * Get current maintenance mode status
 */
export async function getMaintenanceMode(): Promise<MaintenanceServiceResponse<MaintenanceMode>> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('maintenance_mode')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      logger.error('maintenance_mode_fetch_error', { error })
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    logger.error('maintenance_mode_unexpected_error', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Set maintenance mode (enable/disable)
 */
export async function setMaintenanceMode(
  dto: SetMaintenanceModeDTO
): Promise<MaintenanceServiceResponse<MaintenanceMode>> {
  try {
    const supabase = createServiceRoleClient()

    const updateData: any = {
      is_enabled: dto.is_enabled,
      notes: dto.notes || null,
    }

    if (dto.is_enabled) {
      updateData.enabled_by = dto.updated_by
      updateData.enabled_at = new Date().toISOString()
    } else {
      updateData.disabled_at = new Date().toISOString()
    }

    // Update the single maintenance_mode record
    // First, get the ID of the maintenance_mode record
    const { data: existingRecord } = await supabase
      .from('maintenance_mode')
      .select('id')
      .limit(1)
      .single()

    if (!existingRecord) {
      return { success: false, error: 'Maintenance mode record not found. Please run the SQL setup script.' }
    }

    const { data, error } = await supabase
      .from('maintenance_mode')
      .update(updateData)
      .eq('id', existingRecord.id)
      .select()
      .single()

    if (error) {
      logger.error('maintenance_mode_update_error', { error, dto })
      return { success: false, error: error.message }
    }

    logger.info('maintenance_mode_updated', { isEnabled: dto.is_enabled, updatedBy: dto.updated_by })
    return { success: true, data }
  } catch (error) {
    logger.error('maintenance_mode_update_unexpected_error', { error, dto })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
