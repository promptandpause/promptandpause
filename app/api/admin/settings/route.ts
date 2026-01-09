import { NextRequest, NextResponse } from 'next/server'
import { getSystemSettings, updateSystemSetting } from '@/lib/services/adminService'
import { verifyAdminAccess } from '@/lib/middleware/verifyAdminAccess'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request, 'super_admin')
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const result = await getSystemSettings()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ settings: result.settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request, 'super_admin')
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode || 403 }
      )
    }

    const { key, value } = await request.json()
    const result = await updateSystemSetting(key, value, auth.adminEmail!)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ setting: result.setting })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
