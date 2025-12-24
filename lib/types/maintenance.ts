/**
 * Maintenance Types
 * 
 * Types for scheduled maintenance windows, notifications, and maintenance mode.
 */

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type NotificationType = 'planned' | 'completed'

export interface MaintenanceWindow {
  id: string
  scheduled_date: string // ISO date string (YYYY-MM-DD)
  start_time: string // Time string (HH:MM:SS)
  end_time: string // Time string (HH:MM:SS)
  affected_services: string[]
  description: string | null
  status: MaintenanceStatus
  notification_sent: boolean
  notification_sent_at: string | null
  completion_notification_sent: boolean
  completion_notification_sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  notes: string | null
}

export interface MaintenanceNotification {
  id: string
  maintenance_window_id: string
  notification_type: NotificationType
  recipient_count: number
  sent_at: string
  sent_by: string | null
  batch_details: Record<string, any> // JSONB for batch sizes, retry counts, errors
}

export interface MaintenanceMode {
  id: string
  is_enabled: boolean
  enabled_by: string | null
  enabled_at: string | null
  disabled_at: string | null
  updated_at: string
  notes: string | null
}

// DTO for creating a maintenance window
export interface CreateMaintenanceWindowDTO {
  scheduled_date: string // Must be Saturday or Sunday
  start_time: string
  end_time: string
  affected_services: string[]
  description?: string
  created_by: string
}

// DTO for updating a maintenance window
export interface UpdateMaintenanceWindowDTO {
  scheduled_date?: string // Must be Saturday or Sunday
  start_time?: string
  end_time?: string
  affected_services?: string[]
  description?: string
  status?: MaintenanceStatus
  notes?: string
}

// DTO for sending maintenance notifications
export interface SendMaintenanceNotificationDTO {
  maintenance_window_id: string
  notification_type: NotificationType
  sent_by: string
  notes?: string // Optional notes for completion notifications
  improvements?: string // Optional improvements summary for completion
}

// DTO for toggling maintenance mode
export interface SetMaintenanceModeDTO {
  is_enabled: boolean
  updated_by: string
  notes?: string
}

// Service response types
export interface MaintenanceServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Maintenance window with notification summary
export interface MaintenanceWindowWithNotifications extends MaintenanceWindow {
  notifications: MaintenanceNotification[]
}

// Helper type for batch sending results
export interface BatchSendResult {
  total_recipients: number
  successful_sends: number
  failed_sends: number
  errors: Array<{ email: string; error: string }>
}

// Weekend validation helper
export function isWeekend(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getUTCDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

// Format time for display
export function formatMaintenanceTime(date: string, startTime: string, endTime: string): string {
  const d = new Date(date)
  return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} from ${startTime} to ${endTime} UTC`
}
