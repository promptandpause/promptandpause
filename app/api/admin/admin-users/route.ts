import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getAllAdminUsers, 
  createAdminUser,
  CreateAdminUserDTO 
} from '@/lib/services/adminUserService'
import { sendAdminCredentialsEmail } from '@/lib/services/emailService'

/**
 * GET /api/admin/admin-users
 * Get all admin users
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await getAllAdminUsers(user.email!)

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
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/admin-users
 * Create a new admin user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    const dto: CreateAdminUserDTO = {
      email,
      full_name,
      role,
      department,
      created_by_email: user.email!
    }

    const result = await createAdminUser(dto)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 400 }
      )
    }

    // Send credentials email
    if (result.password && result.admin_user) {
      await sendAdminCredentialsEmail(
        result.admin_user.email,
        result.admin_user.full_name,
        result.password,
        result.admin_user.role
      )
    }

    return NextResponse.json({
      success: true,
      user: result.admin_user,
      message: 'Admin user created successfully. Credentials sent via email.'
    })
  } catch (error: any) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
