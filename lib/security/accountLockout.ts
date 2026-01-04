/**
 * Account Lockout Service
 * 
 * Provides brute force protection by tracking failed login attempts
 * and temporarily locking accounts after too many failures.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { SecurityLogger } from './securityLogger'

export interface LockoutConfig {
  maxAttempts: number          // Max failed attempts before lockout
  lockoutDurationMs: number    // How long to lock account (in ms)
  attemptWindowMs: number      // Time window for counting attempts
  progressiveLockout: boolean  // Increase lockout duration with repeated lockouts
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,  // 15 minutes
  attemptWindowMs: 15 * 60 * 1000,    // 15 minutes
  progressiveLockout: true,
}

// In-memory tracking for failed attempts (for fast lookups)
const failedAttempts = new Map<string, { count: number; firstAttempt: number; lockouts: number }>()

/**
 * Account Lockout Class
 */
export class AccountLockout {
  private static config: LockoutConfig = DEFAULT_CONFIG

  /**
   * Configure lockout settings
   */
  static configure(config: Partial<LockoutConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Record a failed login attempt
   * Returns true if account is now locked
   */
  static async recordFailedAttempt(
    identifier: string,
    ip: string,
    userAgent: string,
    email?: string
  ): Promise<{ locked: boolean; remainingAttempts: number; lockoutUntil?: Date }> {
    const key = this.getKey(identifier)
    const now = Date.now()

    let record = failedAttempts.get(key)

    // Check if we should reset the counter (window expired)
    if (record && now - record.firstAttempt > this.config.attemptWindowMs) {
      record = { count: 0, firstAttempt: now, lockouts: record.lockouts }
    }

    // Initialize or update record
    if (!record) {
      record = { count: 1, firstAttempt: now, lockouts: 0 }
    } else {
      record.count++
    }

    failedAttempts.set(key, record)

    // Check if we should lock
    if (record.count >= this.config.maxAttempts) {
      const lockoutDuration = this.calculateLockoutDuration(record.lockouts)
      const lockoutUntil = new Date(now + lockoutDuration)
      
      record.lockouts++
      record.count = 0
      record.firstAttempt = now
      failedAttempts.set(key, record)

      // Persist lockout to database
      await this.persistLockout(identifier, lockoutUntil, email)

      // Log the lockout
      await SecurityLogger.logAccountLockout(
        ip,
        userAgent,
        identifier,
        email,
        `${record.lockouts} consecutive lockouts`
      )

      return {
        locked: true,
        remainingAttempts: 0,
        lockoutUntil,
      }
    }

    return {
      locked: false,
      remainingAttempts: this.config.maxAttempts - record.count,
    }
  }

  /**
   * Reset failed attempts on successful login
   */
  static async recordSuccessfulLogin(identifier: string): Promise<void> {
    const key = this.getKey(identifier)
    const record = failedAttempts.get(key)
    
    if (record) {
      // Keep lockout count for progressive lockout, but reset attempts
      failedAttempts.set(key, { count: 0, firstAttempt: Date.now(), lockouts: record.lockouts })
    }

    // Clear any database lockout
    await this.clearLockout(identifier)
  }

  /**
   * Check if an account is currently locked
   */
  static async isLocked(identifier: string): Promise<{ locked: boolean; lockoutUntil?: Date; reason?: string }> {
    // First check in-memory (for IP-based lockouts)
    const key = this.getKey(identifier)
    const record = failedAttempts.get(key)
    
    // Check database for persistent lockouts
    try {
      const supabase = createServiceRoleClient()
      
      // Try to find user by email or ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('locked_until, lock_reason')
        .or(`id.eq.${identifier},email.eq.${identifier}`)
        .maybeSingle()

      if (error || !profile) {
        return { locked: false }
      }

      if (profile.locked_until) {
        const lockoutUntil = new Date(profile.locked_until)
        
        if (lockoutUntil > new Date()) {
          return {
            locked: true,
            lockoutUntil,
            reason: profile.lock_reason || 'Too many failed login attempts',
          }
        } else {
          // Lockout expired, clear it
          await this.clearLockout(identifier)
        }
      }

      return { locked: false }
    } catch (error) {
      console.error('[SECURITY] Error checking account lockout:', error)
      return { locked: false }
    }
  }

  /**
   * Manually lock an account (admin action)
   */
  static async lockAccount(
    userId: string,
    reason: string,
    durationMs: number = this.config.lockoutDurationMs,
    adminId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    const lockoutUntil = new Date(Date.now() + durationMs)
    
    await this.persistLockout(userId, lockoutUntil, undefined, reason)

    // Log admin action
    if (adminId && ip && userAgent) {
      await SecurityLogger.logAdminAction(
        ip,
        userAgent,
        adminId,
        'manual_account_lock',
        { targetUserId: userId, reason, durationMs }
      )
    }
  }

  /**
   * Manually unlock an account (admin action)
   */
  static async unlockAccount(
    userId: string,
    adminId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    await this.clearLockout(userId)
    
    // Clear in-memory tracking
    const key = this.getKey(userId)
    failedAttempts.delete(key)

    // Log admin action
    if (adminId && ip && userAgent) {
      await SecurityLogger.logAdminAction(
        ip,
        userAgent,
        adminId,
        'manual_account_unlock',
        { targetUserId: userId }
      )
    }
  }

  /**
   * Get lockout status for multiple users (admin dashboard)
   */
  static async getLockedAccounts(): Promise<Array<{
    userId: string
    email: string
    lockedUntil: Date
    reason: string
  }>> {
    try {
      const supabase = createServiceRoleClient()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, locked_until, lock_reason')
        .not('locked_until', 'is', null)
        .gt('locked_until', new Date().toISOString())

      if (error || !data) {
        return []
      }

      return data.map(row => ({
        userId: row.id,
        email: row.email,
        lockedUntil: new Date(row.locked_until),
        reason: row.lock_reason || 'Unknown',
      }))
    } catch (error) {
      console.error('[SECURITY] Error getting locked accounts:', error)
      return []
    }
  }

  /**
   * Calculate lockout duration with progressive increase
   */
  private static calculateLockoutDuration(previousLockouts: number): number {
    if (!this.config.progressiveLockout) {
      return this.config.lockoutDurationMs
    }

    // Progressive lockout: 15min, 30min, 1hr, 2hr, 4hr, 8hr, 24hr
    const multipliers = [1, 2, 4, 8, 16, 32, 96]
    const multiplier = multipliers[Math.min(previousLockouts, multipliers.length - 1)]
    
    return this.config.lockoutDurationMs * multiplier
  }

  /**
   * Get unique key for tracking
   */
  private static getKey(identifier: string): string {
    return `lockout:${identifier.toLowerCase()}`
  }

  /**
   * Persist lockout to database
   */
  private static async persistLockout(
    identifier: string,
    lockoutUntil: Date,
    email?: string,
    reason: string = 'Too many failed login attempts'
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      // Try to update by ID first, then by email
      const { error: idError } = await supabase
        .from('profiles')
        .update({
          locked_until: lockoutUntil.toISOString(),
          lock_reason: reason,
        })
        .eq('id', identifier)

      if (idError && email) {
        await supabase
          .from('profiles')
          .update({
            locked_until: lockoutUntil.toISOString(),
            lock_reason: reason,
          })
          .eq('email', email)
      }
    } catch (error) {
      console.error('[SECURITY] Error persisting lockout:', error)
    }
  }

  /**
   * Clear lockout from database
   */
  private static async clearLockout(identifier: string): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      await supabase
        .from('profiles')
        .update({
          locked_until: null,
          lock_reason: null,
        })
        .or(`id.eq.${identifier},email.eq.${identifier}`)
    } catch (error) {
      console.error('[SECURITY] Error clearing lockout:', error)
    }
  }

  /**
   * Clean up expired records from memory
   */
  static cleanup(): void {
    const now = Date.now()
    const maxAge = this.config.attemptWindowMs * 2

    for (const [key, record] of failedAttempts.entries()) {
      if (now - record.firstAttempt > maxAge && record.count === 0) {
        failedAttempts.delete(key)
      }
    }
  }
}

// Periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => AccountLockout.cleanup(), 5 * 60 * 1000) // Every 5 minutes
}

export default AccountLockout
