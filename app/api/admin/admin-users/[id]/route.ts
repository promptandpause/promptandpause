import { NextRequest, NextResponse } from 'next/server'
import { 
  updateAdminUser,
  deactivateAdminUser,
  UpdateAdminUserDTO 
} from '@/lib/services/adminUserService'
import { verifyAdminAccess } from '@/lib/middleware/verifyAdminAccess'

/**
 * PATCH /api/admin/admin-users/[id]
 * Update admin user details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminAccess(request, 'admin')
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const body = await request.json()
    const { full_name, role, department, is_active } = body

    const dto: UpdateAdminUserDTO = {
      full_name,
      role,
      department,
      is_active,
      updated_by_email: auth.adminEmail!
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
    const auth = await verifyAdminAccess(request, 'admin')
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const result = await deactivateAdminUser(params.id, auth.adminEmail!)

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
