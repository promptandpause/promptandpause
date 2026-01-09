import { NextRequest, NextResponse } from 'next/server'
import { 
  updateAdminEmail,
  UpdateAdminEmailDTO 
} from '@/lib/services/adminUserService'
import { verifyAdminAccess } from '@/lib/middleware/verifyAdminAccess'

/**
 * PATCH /api/admin/admin-users/[id]/email
 * Update admin user email (super admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminAccess(request, 'super_admin')
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const body = await request.json()
    const { new_email } = body

    if (!new_email) {
      return NextResponse.json(
        { error: 'New email is required' },
        { status: 400 }
      )
    }

    const dto: UpdateAdminEmailDTO = {
      user_id: params.id,
      new_email,
      updated_by_email: auth.adminEmail!
    }

    const result = await updateAdminEmail(dto)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('super admin') ? 403 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update email' },
      { status: 500 }
    )
  }
}
