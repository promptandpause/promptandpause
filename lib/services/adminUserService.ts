import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import crypto from 'crypto'

/**
 * Admin User Service
 * 
 * Handles admin user management with role-based access control:
 * - super_admin: Full access to everything including API/backend
 * - admin: Can create other admins, access admin panel only
 * - employee: Limited access based on permissions
 * 
 * Domain locked to @promptandpause.com
 */

// ============================================================================
// TYPES
// ============================================================================

export type AdminRole = 'super_admin' | 'admin' | 'employee'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  full_name: string
  role: AdminRole
  department?: string
  is_active: boolean
  created_at: string
  created_by?: string
  updated_at: string
  last_login_at?: string
  metadata?: Record<string, any>
}

export interface CreateAdminUserDTO {
  email: string
  full_name: string
  role: AdminRole
  department?: string
  created_by_email: string
}

export interface UpdateAdminUserDTO {
  full_name?: string
  role?: AdminRole
  department?: string
  is_active?: boolean
  updated_by_email: string
}

export interface UpdateAdminPasswordDTO {
  user_id: string
  new_password: string
  updated_by_email: string
}

export interface UpdateAdminEmailDTO {
  user_id: string
  new_email: string
  updated_by_email: string
}

// ============================================================================
// ROLE CHECKING
// ============================================================================

/**
 * Check if user has admin access (any admin role)
 */
export async function isAdminUser(email: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    return !error && !!data
  } catch (error) {
    logger.error('is_admin_user_check_error', { error, email })
    return false
  }
}

/**
 * Get admin user's role
 */
export async function getAdminRole(email: string): Promise<AdminRole | null> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !data) return null
    return data.role as AdminRole
  } catch (error) {
    logger.error('get_admin_role_error', { error, email })
    return null
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  const role = await getAdminRole(email)
  return role === 'super_admin'
}

/**
 * Check if user can create other admins
 * Only super_admin and admin roles can create admins
 */
export async function canCreateAdmins(email: string): Promise<boolean> {
  const role = await getAdminRole(email)
  return role === 'super_admin' || role === 'admin'
}

/**
 * Check if user can manage another user
 * Super admins can manage anyone
 * Admins can manage other admins and employees (but not super admins)
 */
export async function canManageUser(
  managerEmail: string,
  targetRole: AdminRole
): Promise<boolean> {
  const managerRole = await getAdminRole(managerEmail)
  
  if (!managerRole) return false
  if (managerRole === 'super_admin') return true
  if (managerRole === 'admin' && targetRole !== 'super_admin') return true
  
  return false
}

// ============================================================================
// ADMIN USER CRUD
// ============================================================================

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const randomBytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  
  return password
}

/**
 * Validate email domain
 */
function isValidAdminEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@promptandpause.com')
}

/**
 * Create a new admin user
 */
export async function createAdminUser(dto: CreateAdminUserDTO): Promise<{
  success: boolean
  admin_user?: AdminUser
  password?: string
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()

    // Validate email domain
    if (!isValidAdminEmail(dto.email)) {
      return {
        success: false,
        error: 'Email must be from @promptandpause.com domain'
      }
    }

    // Check if creator has permission
    const canCreate = await canCreateAdmins(dto.created_by_email)
    if (!canCreate) {
      return {
        success: false,
        error: 'You do not have permission to create admin users'
      }
    }

    // Get creator's admin user ID
    const { data: creator } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', dto.created_by_email)
      .single()

    // Generate secure password
    const generatedPassword = generateSecurePassword()

    // Create auth user first
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: dto.email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: dto.full_name,
        role: dto.role,
        is_admin: true
      }
    })

    if (authError || !authUser.user) {
      logger.error('create_auth_user_error', { error: authError, dto })
      return {
        success: false,
        error: authError?.message || 'Failed to create auth user'
      }
    }

    // Create admin user record
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authUser.user.id,
        email: dto.email,
        full_name: dto.full_name,
        role: dto.role,
        department: dto.department,
        created_by: creator?.id
      })
      .select()
      .single()

    if (adminError) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authUser.user.id)
      logger.error('create_admin_user_error', { error: adminError, dto })
      return {
        success: false,
        error: adminError.message
      }
    }

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_email: dto.created_by_email,
      p_action_type: 'admin_user_created',
      p_target_type: 'admin_user',
      p_target_id: adminUser.id,
      p_details: { role: dto.role, email: dto.email }
    })

    logger.info('admin_user_created', { 
      adminUserId: adminUser.id, 
      email: dto.email,
      role: dto.role,
      createdBy: dto.created_by_email 
    })

    return {
      success: true,
      admin_user: adminUser,
      password: generatedPassword
    }
  } catch (error) {
    logger.error('create_admin_user_unexpected_error', { error, dto })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers(requestorEmail: string): Promise<{
  success: boolean
  users?: AdminUser[]
  error?: string
}> {
  try {
    // Check if requestor is admin
    const isAdmin = await isAdminUser(requestorEmail)
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required'
      }
    }

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('get_all_admin_users_error', { error })
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      users: data
    }
  } catch (error) {
    logger.error('get_all_admin_users_unexpected_error', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get admin user by email
 */
export async function getAdminUserByEmail(email: string): Promise<{
  success: boolean
  user?: AdminUser
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      user: data
    }
  } catch (error) {
    logger.error('get_admin_user_by_email_error', { error, email })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update admin user
 */
export async function updateAdminUser(
  userId: string,
  dto: UpdateAdminUserDTO
): Promise<{
  success: boolean
  user?: AdminUser
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()

    // Get target user's current role
    const { data: targetUser } = await supabase
      .from('admin_users')
      .select('role, email')
      .eq('user_id', userId)
      .single()

    if (!targetUser) {
      return {
        success: false,
        error: 'Admin user not found'
      }
    }

    // Check if updater can manage this user
    const canManage = await canManageUser(dto.updated_by_email, targetUser.role as AdminRole)
    if (!canManage) {
      return {
        success: false,
        error: 'You do not have permission to update this user'
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (dto.full_name !== undefined) updateData.full_name = dto.full_name
    if (dto.role !== undefined) updateData.role = dto.role
    if (dto.department !== undefined) updateData.department = dto.department
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active

    // Update admin user
    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error('update_admin_user_error', { error, userId, dto })
      return {
        success: false,
        error: error.message
      }
    }

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_email: dto.updated_by_email,
      p_action_type: 'admin_user_updated',
      p_target_type: 'admin_user',
      p_target_id: data.id,
      p_details: updateData
    })

    logger.info('admin_user_updated', { userId, updatedBy: dto.updated_by_email })

    return {
      success: true,
      user: data
    }
  } catch (error) {
    logger.error('update_admin_user_unexpected_error', { error, userId, dto })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update admin user password
 */
export async function updateAdminPassword(dto: UpdateAdminPasswordDTO): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()

    // Get target user
    const { data: targetUser } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('user_id', dto.user_id)
      .single()

    if (!targetUser) {
      return {
        success: false,
        error: 'Admin user not found'
      }
    }

    // Check permissions
    const isSelf = targetUser.email === dto.updated_by_email
    const canManage = await canManageUser(dto.updated_by_email, targetUser.role as AdminRole)

    if (!isSelf && !canManage) {
      return {
        success: false,
        error: 'You do not have permission to update this user\'s password'
      }
    }

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(dto.user_id, {
      password: dto.new_password
    })

    if (error) {
      logger.error('update_admin_password_error', { error, userId: dto.user_id })
      return {
        success: false,
        error: error.message
      }
    }

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_email: dto.updated_by_email,
      p_action_type: 'admin_password_updated',
      p_target_type: 'admin_user',
      p_target_id: dto.user_id,
      p_details: { target_email: targetUser.email }
    })

    logger.info('admin_password_updated', { userId: dto.user_id, updatedBy: dto.updated_by_email })

    return {
      success: true
    }
  } catch (error) {
    logger.error('update_admin_password_unexpected_error', { error, dto })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update admin user email (super admin only)
 */
export async function updateAdminEmail(dto: UpdateAdminEmailDTO): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Only super admins can update emails
    const isSuperAdminUser = await isSuperAdmin(dto.updated_by_email)
    if (!isSuperAdminUser) {
      return {
        success: false,
        error: 'Only super admins can update email addresses'
      }
    }

    // Validate new email domain
    if (!isValidAdminEmail(dto.new_email)) {
      return {
        success: false,
        error: 'Email must be from @promptandpause.com domain'
      }
    }

    const supabase = createServiceRoleClient()

    // Update auth user email
    const { error: authError } = await supabase.auth.admin.updateUserById(dto.user_id, {
      email: dto.new_email
    })

    if (authError) {
      logger.error('update_admin_email_auth_error', { error: authError, dto })
      return {
        success: false,
        error: authError.message
      }
    }

    // Update admin user record
    const { error: dbError } = await supabase
      .from('admin_users')
      .update({ email: dto.new_email })
      .eq('user_id', dto.user_id)

    if (dbError) {
      logger.error('update_admin_email_db_error', { error: dbError, dto })
      return {
        success: false,
        error: dbError.message
      }
    }

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_email: dto.updated_by_email,
      p_action_type: 'admin_email_updated',
      p_target_type: 'admin_user',
      p_target_id: dto.user_id,
      p_details: { new_email: dto.new_email }
    })

    logger.info('admin_email_updated', { userId: dto.user_id, newEmail: dto.new_email })

    return {
      success: true
    }
  } catch (error) {
    logger.error('update_admin_email_unexpected_error', { error, dto })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Deactivate admin user
 */
export async function deactivateAdminUser(
  userId: string,
  deactivatedByEmail: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createServiceRoleClient()

    // Get target user
    const { data: targetUser } = await supabase
      .from('admin_users')
      .select('role, email')
      .eq('user_id', userId)
      .single()

    if (!targetUser) {
      return {
        success: false,
        error: 'Admin user not found'
      }
    }

    // Check permissions
    const canManage = await canManageUser(deactivatedByEmail, targetUser.role as AdminRole)
    if (!canManage) {
      return {
        success: false,
        error: 'You do not have permission to deactivate this user'
      }
    }

    // Deactivate user
    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) {
      logger.error('deactivate_admin_user_error', { error, userId })
      return {
        success: false,
        error: error.message
      }
    }

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_email: deactivatedByEmail,
      p_action_type: 'admin_user_deactivated',
      p_target_type: 'admin_user',
      p_target_id: userId,
      p_details: { target_email: targetUser.email }
    })

    logger.info('admin_user_deactivated', { userId, deactivatedBy: deactivatedByEmail })

    return {
      success: true
    }
  } catch (error) {
    logger.error('deactivate_admin_user_unexpected_error', { error, userId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(email: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('email', email)
  } catch (error) {
    logger.error('update_last_login_error', { error, email })
  }
}
