import { NextRequest, NextResponse } from 'next/server'
import {
  getAllAdminUsers,
  createAdminUser,
  CreateAdminUserDTO
} from '@/lib/services/adminUserService'
import { sendAdminCredentialsEmail } from '@/lib/services/emailService'
import { verifyAdminAccess, logAdminAction } from '@/lib/middleware/verifyAdminAccess'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/admin-users
 * Get all admin users
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request, 'admin')
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const result = await getAllAdminUsers(auth.adminEmail!)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: result.users
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/admin-users
 * Create a new admin user (requires super_admin or admin role)
 */
export async function POST(request: NextRequest) {
  try {
    // Require super_admin or admin role to create other admins
    const auth = await verifyAdminAccess(request, 'admin')
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const body = await request.json()
    const { email, full_name, role, department } = body

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['super_admin', 'admin', 'employee'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: super_admin, admin, or employee' },
        { status: 400 }
      )
    }

    // Additional restriction: only super_admin can create other super_admins
    if (role === 'super_admin' && auth.adminRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only super_admin can create super_admin accounts' },
        { status: 403 }
      )
    }

    const dto: CreateAdminUserDTO = {
      email,
      full_name,
      role,
      department,
      created_by_email: auth.adminEmail!
    }

    const result = await createAdminUser(dto)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 400 }
      )
    }

    // Log admin creation
    await logAdminAction(
      auth.adminEmail!,
      'admin_user_created',
      'admin_user',
      result.admin_user?.id,
      { role, email },
      request
    )

    // Send credentials email
    if (result.password && result.admin_user) {
      const emailResult = await sendAdminCredentialsEmail(
        result.admin_user.email,
        result.admin_user.full_name,
        result.password,
        result.admin_user.role
      )

      if (!emailResult.success) {
        // Roll back account creation so we don't create an admin who never received credentials.
        try {
          const supabase = createServiceRoleClient()
          await supabase.auth.admin.deleteUser(result.admin_user.user_id)
        } catch (rollbackError) {
          // If rollback fails, still surface the email failure clearly.
          return NextResponse.json(
            {
              error: 'Failed to send credentials email, and rollback failed. Please contact support.',
              details: {
                emailError: emailResult.error,
              },
            },
            { status: 500 }
          )
        }

        return NextResponse.json(
          {
            error: 'Failed to send credentials email. Admin user was not created.',
            details: {
              emailError: emailResult.error,
            },
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      user: result.admin_user,
      message: 'Admin user created successfully. Credentials sent via email.'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
