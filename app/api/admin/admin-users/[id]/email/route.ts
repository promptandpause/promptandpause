import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  updateAdminEmail,
  UpdateAdminEmailDTO 
} from '@/lib/services/adminUserService'

/**
 * PATCH /api/admin/admin-users/[id]/email
 * Update admin user email (super admin only)
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
      updated_by_email: user.email!
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
    console.error('Error updating email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update email' },
      { status: 500 }
    )
  }
}
