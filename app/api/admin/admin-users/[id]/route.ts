import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  updateAdminUser,
  deactivateAdminUser,
  UpdateAdminUserDTO 
} from '@/lib/services/adminUserService'

/**
 * PATCH /api/admin/admin-users/[id]
 * Update admin user details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { full_name, role, department, is_active } = body

    const dto: UpdateAdminUserDTO = {
      full_name,
      role,
      department,
      is_active,
      updated_by_email: user.email!
    }

    const result = await updateAdminUser(params.id, dto)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Admin user updated successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update admin user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/admin-users/[id]
 * Deactivate admin user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await deactivateAdminUser(params.id, user.email!)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user deactivated successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate admin user' },
      { status: 500 }
    )
  }
}
