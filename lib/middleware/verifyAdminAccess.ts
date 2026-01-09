import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser, getAdminRole, updateLastLogin } from '@/lib/services/adminUserService'
import { logger } from '@/lib/utils/logger'

export interface AdminAuthResult {
  success: boolean
  adminEmail?: string
  adminRole?: 'super_admin' | 'admin' | 'employee'
  error?: string
  statusCode?: number
}

/**
 * Verify admin access with comprehensive checks
 * 
 * Checks:
 * 1. Valid Supabase session
 * 2. Email domain constraint (@promptandpause.com)
 * 3. Matching row in admin_users table
 * 4. is_active = true
 * 5. Optional role check
 * 
 * @param request - Next.js request object
 * @param requiredRole - Optional: require specific role (super_admin, admin, employee)
 * @returns AdminAuthResult with success status and admin details
 */
export async function verifyAdminAccess(
  request: NextRequest,
  requiredRole?: 'super_admin' | 'admin' | 'employee'
): Promise<AdminAuthResult> {
  try {
    // 1. Check valid Supabase session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      logger.warn('admin_auth_failed', { reason: 'no_session' })
      return {
        success: false,
        error: 'Unauthorized: No valid session',
        statusCode: 401
      }
    }

    // 2. Domain validation
    const ADMIN_DOMAIN = '@promptandpause.com'
    if (!user.email.endsWith(ADMIN_DOMAIN)) {
      logger.warn('admin_auth_failed', { 
        reason: 'invalid_domain',
        email: user.email 
      })
      return {
        success: false,
        error: 'Forbidden: Admin access restricted to @promptandpause.com domain',
        statusCode: 403
      }
    }

    // 3. Check admin_users table (source of truth)
    const isAdmin = await isAdminUser(user.email)
    if (!isAdmin) {
      logger.warn('admin_auth_failed', { 
        reason: 'not_in_admin_users',
        email: user.email 
      })
      return {
        success: false,
        error: 'Forbidden: Admin access required',
        statusCode: 403
      }
    }

    // 4. Get admin role
    const role = await getAdminRole(user.email)
    if (!role) {
      logger.warn('admin_auth_failed', { 
        reason: 'no_role_found',
        email: user.email 
      })
      return {
        success: false,
        error: 'Forbidden: Admin role not found',
        statusCode: 403
      }
    }

    // 5. Optional role check
    if (requiredRole) {
      const hasRequiredRole = checkRolePermission(role, requiredRole)
      if (!hasRequiredRole) {
        logger.warn('admin_auth_failed', { 
          reason: 'insufficient_role',
          email: user.email,
          role,
          requiredRole 
        })
        return {
          success: false,
          error: `Forbidden: ${requiredRole} role required`,
          statusCode: 403
        }
      }
    }

    // Success
    logger.info('admin_auth_success', { 
      email: user.email,
      role,
      ip: getClientIp(request)
    })

    // Track last login time for admin users
    try {
      await updateLastLogin(user.email)
    } catch (error) {
      logger.warn('admin_last_login_update_failed', { error, email: user.email })
    }

    return {
      success: true,
      adminEmail: user.email,
      adminRole: role
    }
  } catch (error) {
    logger.error('admin_auth_error', { error })
    return {
      success: false,
      error: 'Authentication check failed',
      statusCode: 500
    }
  }
}

/**
 * Check if role has permission for required role
 * super_admin > admin > employee
 */
function checkRolePermission(
  userRole: 'super_admin' | 'admin' | 'employee',
  requiredRole: 'super_admin' | 'admin' | 'employee'
): boolean {
  const roleHierarchy = {
    super_admin: 3,
    admin: 2,
    employee: 1
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: NextRequest): string | undefined {
  // Try various headers for IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return undefined
}

/**
 * Log admin action with IP and user agent
 */
export async function logAdminAction(
  adminEmail: string,
  actionType: string,
  target_type?: string,
  target_id?: string,
  details?: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.rpc('log_admin_activity', {
      p_admin_email: adminEmail,
      p_action_type: actionType,
      p_target_type: target_type || null,
      p_target_id: target_id || null,
      p_details: details || {},
      p_ip_address: request ? getClientIp(request) : null,
      p_user_agent: request?.headers.get('user-agent') || null
    })
  } catch (error) {
    logger.error('log_admin_action_error', { error, adminEmail, actionType })
  }
}
