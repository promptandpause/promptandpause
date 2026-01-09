import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/middleware/verifyAdminAccess'
import { getAdminUserByEmail } from '@/lib/services/adminUserService'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request)
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const result = await getAdminUserByEmail(auth.adminEmail!)
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Admin user not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin profile' },
      { status: 500 }
    )
  }
}
