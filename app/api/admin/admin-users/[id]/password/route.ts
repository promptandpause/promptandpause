import { NextRequest, NextResponse } from 'next/server'
import { 
  updateAdminPassword,
  UpdateAdminPasswordDTO 
} from '@/lib/services/adminUserService'
import { verifyAdminAccess } from '@/lib/middleware/verifyAdminAccess'

/**
 * PATCH /api/admin/admin-users/[id]/password
 * Update admin user password
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminAccess(request)
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const body = await request.json()
    const { new_password } = body

    if (!new_password || new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const dto: UpdateAdminPasswordDTO = {
      user_id: params.id,
      new_password,
      updated_by_email: auth.adminEmail!
    }

    const result = await updateAdminPassword(dto)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    )
  }
}
