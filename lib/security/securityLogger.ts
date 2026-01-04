/**
 * Security Event Logging Service
 * 
 * Provides comprehensive logging for security-related events
 * including authentication failures, rate limiting, and suspicious activity.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export type SecurityEventType = 
  | 'auth_failure'
  | 'auth_success'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'account_lockout'
  | 'account_unlock'
  | 'csrf_failure'
  | 'invalid_input'
  | 'unauthorized_access'
  | 'password_change'
  | 'email_change'
  | 'data_export'
  | 'account_deletion'
  | 'admin_action'
  | 'vpn_detected'
  | 'ip_blocked'

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEvent {
  type: SecurityEventType
  severity: SecurityEventSeverity
  userId?: string
  email?: string
  ip: string
  userAgent: string
  path?: string
  method?: string
  details: Record<string, unknown>
  timestamp: Date
}

interface SecurityLogEntry extends SecurityEvent {
  id?: string
  created_at?: string
}

const severityMap: Record<SecurityEventType, SecurityEventSeverity> = {
  auth_failure: 'medium',
  auth_success: 'low',
  rate_limit_exceeded: 'medium',
  suspicious_activity: 'high',
  account_lockout: 'high',
  account_unlock: 'medium',
  csrf_failure: 'high',
  invalid_input: 'low',
  unauthorized_access: 'high',
  password_change: 'medium',
  email_change: 'medium',
  data_export: 'medium',
  account_deletion: 'high',
  admin_action: 'medium',
  vpn_detected: 'low',
  ip_blocked: 'high',
}

const alertThresholds: Partial<Record<SecurityEventType, number>> = {
  auth_failure: 5,           // Alert after 5 failed attempts
  rate_limit_exceeded: 10,   // Alert after 10 rate limit hits
  suspicious_activity: 1,    // Alert immediately
  account_lockout: 1,        // Alert immediately
  csrf_failure: 3,           // Alert after 3 CSRF failures
  unauthorized_access: 1,    // Alert immediately
  ip_blocked: 1,             // Alert immediately
}

// In-memory event tracking for threshold alerts
const eventCounts = new Map<string, { count: number; resetAt: number }>()

/**
 * Security Logger Class
 */
export class SecurityLogger {
  /**
   * Log a security event
   */
  static async log(
    event: Omit<SecurityEvent, 'timestamp' | 'severity'> & { severity?: SecurityEventSeverity }
  ): Promise<void> {
    const logEntry: SecurityEvent = {
      ...event,
      severity: event.severity || severityMap[event.type] || 'medium',
      timestamp: new Date(),
    }

    // Console log for immediate visibility
    const logLevel = this.getLogLevel(logEntry.severity)
    console[logLevel](
      `[SECURITY:${logEntry.severity.toUpperCase()}]`,
      JSON.stringify({
        type: logEntry.type,
        userId: logEntry.userId,
        ip: logEntry.ip,
        path: logEntry.path,
        details: logEntry.details,
        timestamp: logEntry.timestamp.toISOString(),
      })
    )

    // Store in database for audit trail
    await this.persistEvent(logEntry)

    // Check if we should trigger an alert
    await this.checkAlertThreshold(logEntry)
  }

  /**
   * Log authentication failure
   */
  static async logAuthFailure(
    ip: string,
    userAgent: string,
    email?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log({
      type: 'auth_failure',
      ip,
      userAgent,
      email,
      details: {
        ...details,
        reason: details.reason || 'invalid_credentials',
      },
    })
  }

  /**
   * Log rate limit exceeded
   */
  static async logRateLimitExceeded(
    ip: string,
    userAgent: string,
    userId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log({
      type: 'rate_limit_exceeded',
      ip,
      userAgent,
      userId,
      details: {
        ...details,
        endpoint: details.endpoint || 'unknown',
        limit: details.limit,
        windowMs: details.windowMs,
      },
    })
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    ip: string,
    userAgent: string,
    userId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log({
      type: 'suspicious_activity',
      severity: 'high',
      ip,
      userAgent,
      userId,
      details,
    })
  }

  /**
   * Log account lockout
   */
  static async logAccountLockout(
    ip: string,
    userAgent: string,
    userId: string,
    email?: string,
    reason: string = 'too_many_failures'
  ): Promise<void> {
    await this.log({
      type: 'account_lockout',
      severity: 'high',
      ip,
      userAgent,
      userId,
      email,
      details: { reason },
    })
  }

  /**
   * Log CSRF failure
   */
  static async logCSRFFailure(
    ip: string,
    userAgent: string,
    path: string,
    userId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log({
      type: 'csrf_failure',
      severity: 'high',
      ip,
      userAgent,
      userId,
      path,
      details,
    })
  }

  /**
   * Log VPN detection
   */
  static async logVPNDetected(
    ip: string,
    userAgent: string,
    userId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log({
      type: 'vpn_detected',
      severity: 'low',
      ip,
      userAgent,
      userId,
      details,
    })
  }

  /**
   * Log admin action
   */
  static async logAdminAction(
    ip: string,
    userAgent: string,
    userId: string,
    action: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log({
      type: 'admin_action',
      ip,
      userAgent,
      userId,
      details: {
        action,
        ...details,
      },
    })
  }

  /**
   * Persist event to database
   */
  private static async persistEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      await supabase
        .from('security_logs')
        .insert({
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId,
          email: event.email,
          ip_address: event.ip,
          user_agent: event.userAgent,
          path: event.path,
          method: event.method,
          details: event.details,
          created_at: event.timestamp.toISOString(),
        })
    } catch (error) {
      // Don't let logging failures break the application
      console.error('[SECURITY] Failed to persist security event:', error)
    }
  }

  /**
   * Check if we should trigger an alert based on event frequency
   */
  private static async checkAlertThreshold(event: SecurityEvent): Promise<void> {
    const threshold = alertThresholds[event.type]
    if (!threshold) return

    const key = `${event.type}:${event.userId || event.ip}`
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minute window

    const existing = eventCounts.get(key)
    
    if (!existing || now >= existing.resetAt) {
      eventCounts.set(key, { count: 1, resetAt: now + windowMs })
      return
    }

    existing.count++
    
    if (existing.count >= threshold) {
      await this.triggerAlert(event, existing.count)
      eventCounts.delete(key)
    }
  }

  /**
   * Trigger a security alert
   */
  private static async triggerAlert(event: SecurityEvent, count: number): Promise<void> {
    console.error(
      `[SECURITY ALERT] ${event.type} threshold exceeded!`,
      JSON.stringify({
        type: event.type,
        count,
        userId: event.userId,
        ip: event.ip,
        severity: 'critical',
      })
    )

    // In production, send to alerting service (PagerDuty, Slack, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement alert notification
      // await sendSlackAlert(event, count)
      // await sendPagerDutyAlert(event, count)
    }
  }

  /**
   * Get console log level based on severity
   */
  private static getLogLevel(severity: SecurityEventSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warn'
      default:
        return 'log'
    }
  }

  /**
   * Get recent security events (for admin dashboard)
   */
  static async getRecentEvents(
    limit: number = 100,
    filters?: {
      type?: SecurityEventType
      severity?: SecurityEventSeverity
      userId?: string
      ip?: string
    }
  ): Promise<SecurityLogEntry[]> {
    try {
      const supabase = createServiceRoleClient()
      
      let query = supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (filters?.type) {
        query = query.eq('event_type', filters.type)
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters?.ip) {
        query = query.eq('ip_address', filters.ip)
      }

      const { data, error } = await query

      if (error) {
        console.error('[SECURITY] Failed to fetch security events:', error)
        return []
      }

      return (data || []).map(row => ({
        id: row.id,
        type: row.event_type,
        severity: row.severity,
        userId: row.user_id,
        email: row.email,
        ip: row.ip_address,
        userAgent: row.user_agent,
        path: row.path,
        method: row.method,
        details: row.details,
        timestamp: new Date(row.created_at),
        created_at: row.created_at,
      }))
    } catch (error) {
      console.error('[SECURITY] Failed to fetch security events:', error)
      return []
    }
  }

  /**
   * Get security metrics for dashboard
   */
  static async getSecurityMetrics(
    timeRange: 'hour' | 'day' | 'week' = 'day'
  ): Promise<{
    totalEvents: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    uniqueIPs: number
    blockedRequests: number
  }> {
    try {
      const supabase = createServiceRoleClient()
      
      const timeRangeMs = {
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
      }

      const since = new Date(Date.now() - timeRangeMs[timeRange]).toISOString()

      const { data, error } = await supabase
        .from('security_logs')
        .select('event_type, severity, ip_address')
        .gte('created_at', since)

      if (error || !data) {
        return {
          totalEvents: 0,
          byType: {},
          bySeverity: {},
          uniqueIPs: 0,
          blockedRequests: 0,
        }
      }

      const byType: Record<string, number> = {}
      const bySeverity: Record<string, number> = {}
      const uniqueIPs = new Set<string>()
      let blockedRequests = 0

      for (const row of data) {
        byType[row.event_type] = (byType[row.event_type] || 0) + 1
        bySeverity[row.severity] = (bySeverity[row.severity] || 0) + 1
        uniqueIPs.add(row.ip_address)
        
        if (['rate_limit_exceeded', 'ip_blocked', 'csrf_failure'].includes(row.event_type)) {
          blockedRequests++
        }
      }

      return {
        totalEvents: data.length,
        byType,
        bySeverity,
        uniqueIPs: uniqueIPs.size,
        blockedRequests,
      }
    } catch (error) {
      console.error('[SECURITY] Failed to get security metrics:', error)
      return {
        totalEvents: 0,
        byType: {},
        bySeverity: {},
        uniqueIPs: 0,
        blockedRequests: 0,
      }
    }
  }
}

export default SecurityLogger
